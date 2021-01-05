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

  // start run
  loadTest.start();
};

module.exports = runPorcelain;
