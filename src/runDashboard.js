#!/usr/bin/env node
const { performance } = require("perf_hooks");
const LoadTest = require("./LoadTest");
const blessed = require("blessed");
const contrib = require("blessed-contrib");

module.exports = (config) => {
  const screen = blessed.screen();
  const { grid: Grid } = contrib;

  // create layout and widgets
  const grid = new Grid({
    rows: 3,
    cols: 3,
    screen,
  });

  const throughputGraph = grid.set(0, 0, 1, 3, contrib.line, {
    label: " Throughput [request/s] ",
    showLegend: false,
    style: {
      text: "white",
      baseline: [150, 150, 150],
    },
  });

  const requestsGraph = grid.set(1, 0, 1, 3, contrib.line, {
    label: " Response time [ms] ",
    showLegend: false,
    style: {
      text: "white",
      baseline: [150, 150, 150],
    },
  });

  const table = grid.set(2, 0, 1, 1, contrib.table, {
    keys: false,
    interactive: false,
    fg: "white",
    label: " Info ",
    columnSpacing: 0,
    headers: false,
    columnWidth: [30, 10],
  });

  const out = grid.set(2, 1, 1, 2, contrib.log, { label: "Log" });

  const tableData = {
    workers: {
      title: "Workers",
      value: 0,
    },
    total: {
      title: "Sent requests",
      value: 0,
    },
    success: {
      title: "Succeeded requests",
      value: 0,
    },
    failed: {
      title: "Failed requests",
      value: 0,
    },
    throughput: {
      title: "Throughput [requests/s]",
      value: 0,
    },
    average: {
      title: "Response time [ms]",
      value: 0,
    },
  };

  const runningStates = ["paused", "/", "-", "\\", "|"];
  let runningState = 0;
  const getRunningState = (running) => {
    if (!running) {
      runningState = 0;
    } else {
      runningState = Math.max(1, (runningState + 1) % runningStates.length);
    }
    return runningStates[runningState];
  };
  const round = (num, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };
  const compileTableData = () =>
    Object.keys(tableData).reduce((acc, key) => {
      acc.push([tableData[key].title, tableData[key].value]);
      return acc;
    }, []);
  const setTableData = (running) => {
    const data = compileTableData();
    data.push(
      [""],
      ["Keys"],
      ["Pause / unpause", "[space]"],
      ["Quit", "[esc]"]
    );
    table.setData({
      headers: [" Running / Paused", " " + getRunningState(running)],
      data,
    });
  };

  // set line charts data
  let successDurations = [];
  const updateInterval = 100;
  const intervalsOnScreen = 250;
  const rollingAverageCount = 10;
  const start = performance.now();
  let responseTimestamps = [];
  const throughputInterval = 5000;
  const generateY = (amount) =>
    " "
      .repeat(amount)
      .split("")
      .map((str) => 0);
  const generateX = (amount) =>
    generateY(amount).map((str, i) => ((i * updateInterval) / 1000).toString());
  const average = (arr, rolling = 0) => {
    if (rolling) {
      arr = arr.slice(-1 * rolling);
    }
    return arr.reduce((acc, num) => acc + num, 0) / arr.length || 1;
  };

  const lineSuccess = {
    style: { line: "green" },
    y: generateY(intervalsOnScreen),
    x: generateX(intervalsOnScreen),
  };
  requestsGraph.setData([lineSuccess]);

  const lineTrhoughput = {
    style: { line: "green" },
    y: generateY(intervalsOnScreen),
    x: generateX(intervalsOnScreen),
  };
  throughputGraph.setData([lineTrhoughput]);

  const loadTest = new LoadTest({
    ...config,
    onSuccess: (response, duration, text) => {
      successDurations.push(duration);
      tableData.success.value++;
      tableData.average.value = round(
        average(successDurations, rollingAverageCount),
        2
      );
      out.log(" Ok: " + response.url);
    },
    onFail: (response, duration, text) => {
      tableData.failed.value++;
      out.log(" Failed: " + response.url + " " + JSON.stringify(response));
    },
    onRequest({ url }) {
      tableData.total.value++;
    },
    onResponse(response, duration) {
      const now = performance.now();
      responseTimestamps.push(now);
    },
  });

  let lineInterval;
  const toggle = () => {
    if (loadTest.isRunning()) {
      clearInterval(lineInterval);
      loadTest.stop();
      setTableData(false);
      screen.render();
      return;
    }
    lineInterval = setInterval(function () {
      const success = successDurations.slice(-1 * rollingAverageCount);
      lineSuccess.y.unshift(average(success, rollingAverageCount));
      lineSuccess.y = lineSuccess.y.slice(0, intervalsOnScreen - 1);
      requestsGraph.setData([lineSuccess]);
      requestsGraph.calcSize();

      const now = performance.now();
      const actualInterval = Math.min(throughputInterval, now - start);
      responseTimestamps = responseTimestamps.filter(
        (timestamp) => timestamp + throughputInterval > now
      );
      tableData.throughput.value = round(
        responseTimestamps.length / (actualInterval / 1000),
        2
      );
      lineTrhoughput.y.unshift(tableData.throughput.value);
      lineTrhoughput.y = lineTrhoughput.y.slice(0, intervalsOnScreen - 1);
      throughputGraph.setData([lineTrhoughput]);
      throughputGraph.calcSize();

      setTableData(loadTest.isRunning());

      tableData.workers.value = loadTest.getWorkerCount();

      screen.render();
    }, updateInterval);
    loadTest.start();
    screen.render();
  };

  // start
  toggle();

  // attach keyboard handlers
  screen.key(["space"], function (ch, key) {
    toggle();
  });
  screen.key(["C-c", "q", "escape"], function (ch, key) {
    return process.exit(0);
  });
};
