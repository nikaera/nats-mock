var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  NatsConnection: () => NatsConnection,
  Subscription: () => Subscription,
  connect: () => connect
});
module.exports = __toCommonJS(src_exports);
var import_node_events = __toESM(require("node:events"));
const CLOSED_EVENT = "closed";
class Subscription {
  constructor(eventEmitter, subject, opts) {
    this.eventEmitter = eventEmitter;
    this.subject = subject;
    this.opts = opts;
    this.eventEmitter.on(subject, (frame) => {
      this.yields.add(frame);
    });
    this.eventEmitter.on(CLOSED_EVENT, () => {
      this._closed();
    });
  }
  draining = false;
  done = false;
  sid = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  yields = /* @__PURE__ */ new Set();
  closedNotification = new Promise((resolve) => {
    const timer = setInterval(() => {
      if (this.done)
        resolve(clearInterval(timer));
    }, 1);
  });
  closed = this.closedNotification;
  unsubscribe(max) {
    this._closed();
  }
  drain() {
    this.draining = true;
    return Promise.resolve(this._closed());
  }
  isDraining() {
    return this.draining && !this.isClosed();
  }
  isClosed() {
    return this.done && this.yields.size === 0;
  }
  callback(err, msg) {
    if (this.opts?.callback)
      this.opts.callback(err, msg);
  }
  getSubject() {
    return this.subject;
  }
  getReceived() {
    throw new Error("Method not implemented.");
  }
  getProcessed() {
    throw new Error("Method not implemented.");
  }
  getPending() {
    throw new Error("Method not implemented.");
  }
  getID() {
    return this.sid;
  }
  getMax() {
    return this.opts?.max;
  }
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
  async *iterate() {
    while (true) {
      await new Promise((resolve) => {
        const timer = setInterval(() => {
          if (this.done || this.yields.size > 0)
            resolve(clearInterval(timer));
        }, 1);
      });
      const yields = this.yields;
      for (const frame of yields) {
        yield {
          subject: this.subject,
          sid: this.sid,
          data: frame
        };
      }
      this.yields.clear();
      if (this.done)
        break;
    }
  }
  _closed(err) {
    if (this.done)
      return;
    try {
      this.eventEmitter.removeAllListeners(this.subject);
    } catch (err2) {
      console.log(err2);
    }
    this.done = true;
  }
}
class NatsConnection {
  connected = true;
  eventEmitter = new import_node_events.default();
  closedNotification = new Promise((resolve) => {
    const timer = setInterval(() => {
      if (!this.connected)
        resolve(clearInterval(timer));
    }, 1);
  });
  info;
  closed() {
    return this.closedNotification;
  }
  close() {
    if (!this.connected)
      Promise.resolve();
    this.eventEmitter.emit(CLOSED_EVENT);
    this.eventEmitter.removeAllListeners();
    this.connected = false;
    return Promise.resolve();
  }
  publish(subject, data, options) {
    this.eventEmitter.emit(subject, data);
  }
  subscribe(subject, opts) {
    return new Subscription(this.eventEmitter, subject, opts);
  }
  request(subject, data, opts) {
    throw new Error("Method not implemented.");
  }
  flush() {
    throw new Error("Method not implemented.");
  }
  drain() {
    return this.close();
  }
  isClosed() {
    return !this.connected;
  }
  isDraining() {
    throw new Error("Method not implemented.");
  }
  getServer() {
    throw new Error("Method not implemented.");
  }
  status() {
    throw new Error("Method not implemented.");
  }
  stats() {
    throw new Error("Method not implemented.");
  }
  jetstreamManager(opts) {
    throw new Error("Method not implemented.");
  }
  jetstream(opts) {
    throw new Error("Method not implemented.");
  }
  rtt() {
    throw new Error("Method not implemented.");
  }
}
function connect(opts) {
  return new Promise((resolve) => {
    resolve(new NatsConnection());
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NatsConnection,
  Subscription,
  connect
});
