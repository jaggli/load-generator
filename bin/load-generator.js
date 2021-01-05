#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const commandLineArgs = require("command-line-args");

const runDashboard = require("../src/runDashboard");
const runPorcelain = require("../src/runPorcelain");

const validKeyValue = /^[a-z][a-z0-9]*=[^,\s=]+(,[^,\s=]+)*$/i;
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

// read command line args
const optionDefinitions = [
  {
    name: "url",
    type: String,
    multiple: true,
    defaultOption: true,
  },
  { name: "values", type: String, multiple: true },
  { name: "header", type: String, multiple: true },
  { name: "porcelain", alias: "p", type: Boolean },
  { name: "pause", type: Number },
  { name: "workers", alias: "w", type: Number },
  { name: "timeout", type: Number },
];
const argsOptions = commandLineArgs(optionDefinitions);
if (Array.isArray(argsOptions.url)) {
  options.urls.push(...argsOptions.url);
}
options.values = {
  ...options.values,
  ...parseKeyValues(argsOptions.values),
};
options.headers = {
  ...options.headers,
  ...parseKeyValues(argsOptions.header),
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

// run load generator
const run = porcelain ? runPorcelain : runDashboard;
run(options);
