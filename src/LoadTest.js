const fetch = require("node-fetch");
const { performance } = require("perf_hooks");
const http = require("http");
const https = require("https");

const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const getRandomValue = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getUrl = (urls, values) => {
  let url = getRandomValue(urls);
  Object.keys(values).forEach((key) => {
    url = url.replace(`{${key}}`, getRandomValue(values[key]));
  });
  return url;
};

const getAgent = (url) =>
  url.protocol === "http:"
    ? new http.Agent({
        keepAlive: true,
      })
    : new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      });

const noop = () => true;
class LoadTest {
  constructor({
    urls,
    values,
    headers,
    pause,
    workers,
    timeout,
    onError = noop,
    onFail = noop,
    onRequest = noop,
    onResponse = noop,
    onSuccess = noop,
    verification = noop,
  }) {
    this.pause = pause;
    this.workers = workers;
    this.urls = urls;
    this.values = values;
    this.fetchOptions = {
      headers,
      timeout,
      agent: getAgent,
    };
    this.onError = onError;
    this.onFail = onFail;
    this.onRequest = onRequest;
    this.onResponse = onResponse;
    this.onSuccess = onSuccess;
    this.verification = verification;
    this.isRunning = false;
  }
  async request() {
    const startTime = performance.now();
    const url = getUrl(this.urls, this.values);
    this.onRequest({ url });
    try {
      const response = await fetch(url, this.fetchOptions);
      const duration = Math.round(performance.now() - startTime);
      this.onResponse(response, duration);
      if (response.status >= 200 && response.status < 300) {
        const text = await response.text();
        if (this.verification(text, url)) {
          this.onSuccess(response, duration, text);
          return;
        }
      }
      this.onFail(response, duration);
    } catch (e) {
      this.onError(e);
    }
  }
  async continousRequest() {
    // use setTimeout to avoid callstack overflow
    setTimeout(async () => {
      await this.request();
      await sleep(this.pause);
      if (this.isRunning) {
        this.continousRequest();
      }
    }, 0);
  }
  start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    for (let i = 0; i < this.workers; i++) {
      this.continousRequest();
    }
  }
  stop() {
    this.isRunning = false;
  }
  getWorkerCount() {
    return this.workers;
  }
}

module.exports = LoadTest;
