const fetch = require("node-fetch");
const { performance } = require("perf_hooks");
const http = require("http");
const https = require("https");

const getAgent = (url) =>
  url.protocol === "http:"
    ? new http.Agent({
        keepAlive: true,
      })
    : new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      });
class LoadTest {
  constructor({
    wait = 500,
    workers = 1,
    urls = ["/"],
    values = [],
    fetchOptions = {},
    onSuccess = () => true,
    onFail = () => true,
    onRequest = () => true,
    verification = () => true,
  }) {
    this.wait = wait;
    this.workers = workers;
    this.urls = urls;
    this.values = values;
    this.fetchOptions = {
      agent: getAgent,
      ...fetchOptions,
    };
    this.onSuccess = onSuccess;
    this.onFail = onFail;
    this.onRequest = onRequest;
    this.verification = verification;
    this.timers = [];
    this.running = false;
    this.stop = this.stop.bind(this);
    this.start = this.start.bind(this);
    this.request = this.request.bind(this);
  }
  getRandomValue(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  getUrl() {
    let url = this.getRandomValue(this.urls);
    let lang;
    Object.keys(this.values).forEach((key) => {
      let value = this.getRandomValue(this.values[key]);
      url = url.replace(`{${key}}`, value);
      if (key === "lang") {
        lang = value;
      }
    });
    return {
      url,
      lang,
    };
  }
  async request() {
    const time = performance.now();
    const { url, lang } = this.getUrl();
    this.onRequest({ url });
    try {
      const response = await fetch(url, this.fetchOptions);
      const duration = performance.now() - time;
      if (response.status >= 200 && response.status < 300) {
        const text = await response.text();
        if (this.verification(text, lang)) {
          this.onSuccess(response, duration, text);
          return;
        }
      }
      this.onFail(response, duration);
    } catch (e) {
      console.log(e);
    }
  }
  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    for (let i = 0; i < this.workers; i++) {
      const delay = Math.round((i * this.wait) / this.workers);
      setTimeout(() => {
        this.timers.push(
          setInterval(() => {
            this.request();
          }, this.wait)
        );
        this.request();
      }, delay);
    }
  }
  stop() {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.timers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.timers = [];
  }
}

module.exports = LoadTest;
