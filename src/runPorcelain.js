const LoadTest = require("./LoadTest");

const runPorcelain = (config) => {
  const loadTest = new LoadTest({
    ...config,
    onSuccess: ({ url }, duration, text) => {
      console.log("Ok:", url, `${duration}ms`);
    },
    onFail: ({ url }, duration, text) => {
      console.log("Failed:", url, `${duration}ms`);
    },
    onError: (e) => {
      console.log("Error:", e.message);
    },
  });

  // print header
  console.log("-----------------------");
  console.log("Load Generator");
  console.log("-----------------------");
  const { values, headers, ...bulk } = config;
  console.log(JSON.stringify(bulk, null, 2));
  console.log("-----------------------");

  // listen for exit signals
  const exit = (cause) => {
    loadTest.stop();
    console.log(cause);
    process.exit();
  };
  process.on("SIGTERM", () => exit("Received SIGTERM"));

  // catch esc
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  stdin.on("data", (key) => {
    const exitKeys = [
      "\u0003", // ctrl-c
      "\u001b", // esc
      "\u0071", // q
    ];

    if (exitKeys.includes(key)) {
      return exit("Aborted by user");
    }

    // write the key to stdout all normal like
    process.stdout.write(key);
  });

  // start run
  loadTest.start();
};

module.exports = runPorcelain;
