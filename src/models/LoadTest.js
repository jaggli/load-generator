const fetch = require("node-fetch");
const now = require("performance-now");

class LoadTest {
  constructor({
    wait = 500,
    instances = 1,
    urls = ["/"],
    values = [],
    onSuccess = () => true,
    onFail = () => true,
    onRequest = () => true,
    verification = () => true,
  }) {
    this.wait = wait;
    this.instances = instances;
    this.urls = urls;
    this.values = values;
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
    const time = now();
    const { url, lang } = this.getUrl();
    this.onRequest({ url });
    try {
      const response = await fetch(url);
      const delta = now() - time;
      if (response.status >= 200 && response.status < 300) {
        const text = await response.textConverted();
        if (this.verification(text, lang)) {
          this.onSuccess(response, delta, text);
          return;
        }
      }
      this.onFail(response, delta);
    } catch (e) {}
  }
  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    for (let i = 0; i < this.instances; i++) {
      const delay = Math.round((i * this.wait) / this.instances);
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
