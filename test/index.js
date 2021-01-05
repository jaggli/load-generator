#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const LoadTest = require("../src/models/LoadTest");
const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "load-generator.json"), "utf8")
);

var lt = new LoadTest({
  ...config,
  onSuccess: ({ url }, duration, text) => {
    console.log("Success", url);
  },
  onFail: ({ url }, duration, text) => {
    console.log("Fail", url);
  },
  onRequest({ url }) {
    console.log("Request", url);
  },
  onResponse({ url }) {
    console.log("Response", url);
  },
  onError(error) {
    console.log("Error", error);
  },
});

lt.start();
