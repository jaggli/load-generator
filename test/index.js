#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const LoadTest = require("../src/models/LoadTest");
const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "load-generator.json"), "utf8")
);

var lt = new LoadTest({
  ...config,
  onSuccess: ({ url }, delta, text) => {},
  onFail: ({ url }, delta, text) => {},
  onRequest({ url }) {
    console.log(url);
  },
});

lt.start();
