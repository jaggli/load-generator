#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const commandLineArgs = require("command-line-args");

const runDashboard = require("../src/runDashboard");
const runPorcelain = require("../src/runPorcelain");
const printHelp = require("../src/printHelp");

const validKeyValue = /^[a-z][a-z0-9]*=[^,=]+(,[^,=]+)*$/i;
const parseKeyValues = (keyValues = []) =>
  keyValues.reduce((acc, keyValue) => {
    keyValue = keyValue.trim();
    if (!keyValue.match(validKeyValue)) {
      return acc;
    }
    const [name, values] = keyValue.split("=");
    return {
      ...acc,
      [name]: values.split(","),
    };
  }, {});

const parseHeaders = (headers = []) =>
  headers.reduce((acc, header) => {
    const [name, value] = header.split(/=(.+)/);
    acc[name] = value.trim();
    return acc;
  }, {});

// defaults
let porcelain = false;
const options = {
  urls: [],
  values: {},
  headers: {},
  pause: 0,
  workers: 2,
  timeout: 3000,
};

// read command line args
const optionDefinitions = [
  {
    name: "url",
    type: String,
    multiple: true,
    defaultOption: true,
    description:
      "URLs containing optional placeholders. A placeholder must be in curly brackets and will be filled with the corresponding values in the named values option. This is the default option so the name --url may be ommited for readability, also works with multiple URLs.\n",
  },
  {
    name: "values",
    type: String,
    multiple: true,
    description:
      "Named value lists for placeholders in the URLs. Must follow the following name and comma-separated pattern: name=value1,value2,value3\n",
  },
  {
    name: "header",
    type: String,
    multiple: true,
    description:
      'HTTP header added to every request. Example to add cookies:\n--header "name1=value1; name2:value2"\n',
  },
  {
    name: "porcelain",
    alias: "p",
    type: Boolean,
    description: "Output in machine parseable format.\n",
  },
  {
    name: "pause",
    type: Number,
    description: `Pause between each request per worker in millisecons. Default: {bold ${options.pause}}\n`,
    typeLabel: "{underline ms}",
  },
  {
    name: "workers",
    alias: "w",
    type: Number,
    description: `Amount of parallell requesting workers. Default: {bold ${options.workers}}\n`,
    typeLabel: "{underline amount}",
  },
  {
    name: "timeout",
    type: Number,
    description: `Request timeout in milliseconds, set 0 to use system default. Default: {bold ${options.timeout}}\n`,
    typeLabel: "{underline ms}",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Display this help text.\n",
  },
];
const argsOptions = commandLineArgs(optionDefinitions);

// print help and exit, if flag set
if (argsOptions.help) {
  printHelp(optionDefinitions);
  process.exit();
}

// try to read json
try {
  const jsonOptions = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "load-generator.json"), "utf8")
  );
  if (Array.isArray(jsonOptions.urls)) {
    options.urls.push(...jsonOptions.urls);
  }
  options.values = {
    ...options.values,
    ...(jsonOptions.values || {}),
  };
  options.headers = {
    ...options.headers,
    ...(jsonOptions.headers || {}),
  };
  if (typeof jsonOptions.pause === "number") {
    options.pause = jsonOptions.pause;
  }
  if (typeof jsonOptions.workers === "number") {
    options.workers = jsonOptions.workers;
  }
  if (typeof jsonOptions.timeout === "number") {
    options.timeout = jsonOptions.timeout;
  }
  if (typeof jsonOptions.porcelain === "boolean") {
    porcelain = jsonOptions.porcelain;
  }
} catch (e) {}

// process command line args
if (Array.isArray(argsOptions.url)) {
  options.urls.push(...argsOptions.url);
}
options.values = {
  ...options.values,
  ...parseKeyValues(argsOptions.values),
};
options.headers = {
  ...options.headers,
  ...parseHeaders(argsOptions.header),
};
if (typeof argsOptions.pause === "number") {
  options.pause = argsOptions.pause;
}
if (typeof argsOptions.workers === "number") {
  options.workers = argsOptions.workers;
}
if (typeof argsOptions.timeout === "number") {
  options.timeout = argsOptions.timeout;
}
if (typeof argsOptions.porcelain === "boolean") {
  porcelain = argsOptions.porcelain;
}

if (!options.urls.length) {
  console.error("Error: At least one URL is rquired, see --help.");
  process.exit(1);
}

// run load generator
const run = porcelain ? runPorcelain : runDashboard;
run(options);
