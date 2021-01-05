#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const LoadTest = require("../src/models/LoadTest");
const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "load-generator.json"), "utf8")
);

const blessed = require("blessed");
const contrib = require("blessed-contrib");
const screen = blessed.screen();

screen.key(["escape"], function (ch, key) {
  clearInterval(lineInterval);
  lt.stop();
});
screen.key(["C-c"], function (ch, key) {
  return process.exit(0);
});

const { grid: Grid } = contrib;

// create layout and widgets
const grid = new Grid({
  rows: 2,
  cols: 1,
  screen,
});

const requestsGraph = grid.set(1, 0, 1, 1, contrib.line, {
  showNthLabel: 5,
  label: " Response time ",
  showLegend: false,
});

const table = grid.set(0, 0, 1, 1, contrib.table, {
  keys: false,
  interactive: false,
  fg: "green",
  label: " Stats ",
  columnSpacing: 0,
  headers: false,
  columnWidth: [30, 10],
});

const tableData = {
  sent: {
    title: "Requests sent",
    value: 0,
  },
  success: {
    title: "Successful",
    value: 0,
  },
  failed: {
    title: "Failed",
    value: 0,
  },
  average: {
    title: "Average response time [ms]",
    value: 0,
  },
  instances: {
    title: "Requests per second",
    value: (1000 / config.wait) * config.instances,
  },
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
table.setData({ headers: [" ", " "], data: compileTableData() });

// set line charts data
let successDurations = [];
const updateInterval = 500;
const intervalsOnScreen = 100;
const averageCalcFromLast = 20;
const generateY = (amount) =>
  " "
    .repeat(amount)
    .split("")
    .map((str) => 0);
const generateX = (amount) =>
  generateY(amount)
    .map((str, i) => i.toString())
    .reverse();
const average = (arr) =>
  arr.reduce((acc, num) => acc + num, 0) / arr.length || 1;
const lineSuccess = {
  title: "[ms]",
  style: { line: "green" },
  xLabelPadding: 0,
  xPadding: 0,
  yLabelPadding: 0,
  yPadding: 0,
  y: generateY(intervalsOnScreen),
  x: generateX(intervalsOnScreen),
};
requestsGraph.setData([lineSuccess]);
const lineInterval = setInterval(function () {
  const success = successDurations.slice(-1 * averageCalcFromLast);
  lineSuccess.y.push(average(success));
  lineSuccess.y = lineSuccess.y.slice(-1 * intervalsOnScreen);
  requestsGraph.setData([lineSuccess]);

  table.setData({ headers: [" ", " "], data: compileTableData() });

  screen.render();
}, updateInterval);

const lt = new LoadTest({
  ...config,
  onSuccess: (response, delta, text) => {
    successDurations.push(delta);
    tableData.success.value++;
    tableData.average.value = round(average(successDurations));
  },
  onFail: (response, delta, text) => {
    tableData.failed.value++;
  },
  onRequest() {
    tableData.sent.value++;
  },
});

lt.start();
screen.render();
