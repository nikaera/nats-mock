import EventEmitter from "node:events";

import {
  ConnectionOptions,
  JetStreamClient,
  JetStreamManager,
  JetStreamOptions,
  Msg,
  NatsConnection as INatsConnection,
  NatsError,
  PublishOptions,
  RequestOptions,
  ServerInfo,
  Stats,
  Status,
  Subscription as ISubscription,
  SubscriptionOptions,
} from "nats";

const CLOSED_EVENT = "closed";

export class Subscription implements ISubscription {
  private draining = false;
  private done = false;

  private readonly sid: number = Math.floor(
    Math.random() * Number.MAX_SAFE_INTEGER
  );
  private readonly yields: Set<Uint8Array> = new Set();
  private readonly closedNotification: Promise<void> = new Promise(
    (resolve) => {
      const timer = setInterval(() => {
        if (this.done) resolve(clearInterval(timer));
      }, 1);
    }
  );

  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly subject: string,
    private readonly opts?: SubscriptionOptions
  ) {
    this.eventEmitter.on(subject, (frame: Uint8Array) => {
      this.yields.add(frame);
    });

    this.eventEmitter.on(CLOSED_EVENT, () => {
      this._closed();
    });
  }
  closed: Promise<void> = this.closedNotification;

  unsubscribe(max?: number): void {
    this._closed();
  }
  drain(): Promise<void> {
    this.draining = true;

    return Promise.resolve(this._closed());
  }
  isDraining(): boolean {
    return this.draining && !this.isClosed();
  }
  isClosed(): boolean {
    return this.done && this.yields.size === 0;
  }
  callback(err: NatsError | null, msg: Msg): void {
    if (this.opts?.callback) this.opts.callback(err, msg);
  }
  getSubject(): string {
    return this.subject;
  }
  getReceived(): number {
    throw new Error("Method not implemented.");
  }
  getProcessed(): number {
    throw new Error("Method not implemented.");
  }
  getPending(): number {
    throw new Error("Method not implemented.");
  }
  getID(): number {
    return this.sid;
  }
  getMax(): number | undefined {
    return this.opts?.max;
  }
  [Symbol.asyncIterator](): AsyncIterator<Msg> {
    return this.iterate();
  }

  async *iterate(): AsyncIterator<Msg> {
    while (true) {
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (this.done || this.yields.size > 0) resolve(clearInterval(timer));
        }, 1);
      });

      const yields = this.yields;

      for (const frame of yields) {
        yield {
          subject: this.subject,
          sid: this.sid,
          data: frame,
        } as Msg;
      }

      this.yields.clear();

      if (this.done) break;
    }
  }

  private _closed(err?: Error): void {
    if (this.done) return;

    try {
      this.eventEmitter.removeAllListeners(this.subject);
    } catch (err) {
      console.log(err);
    }

    this.done = true;
  }
}

export class NatsConnection implements INatsConnection {
  private connected = true;

  private readonly eventEmitter = new EventEmitter();
  private readonly closedNotification: Promise<void | Error> = new Promise(
    (resolve) => {
      const timer = setInterval(() => {
        if (!this.connected) resolve(clearInterval(timer));
      }, 1);
    }
  );

  info?: ServerInfo | undefined;
  closed(): Promise<void | Error> {
    return this.closedNotification;
  }
  close(): Promise<void> {
    if (!this.connected) return Promise.resolve();

    this.eventEmitter.emit(CLOSED_EVENT);
    this.eventEmitter.removeAllListeners();
    this.connected = false;

    return Promise.resolve();
  }
  publish(subject: string, data?: Uint8Array, options?: PublishOptions): void {
    this.eventEmitter.emit(subject, data);
  }
  subscribe(subject: string, opts?: SubscriptionOptions): Subscription {
    return new Subscription(this.eventEmitter, subject, opts);
  }
  request(
    subject: string,
    data?: Uint8Array,
    opts?: RequestOptions
  ): Promise<Msg> {
    throw new Error("Method not implemented.");
  }
  flush(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  drain(): Promise<void> {
    return this.close();
  }
  isClosed(): boolean {
    return !this.connected;
  }
  isDraining(): boolean {
    throw new Error("Method not implemented.");
  }
  getServer(): string {
    throw new Error("Method not implemented.");
  }
  status(): AsyncIterable<Status> {
    throw new Error("Method not implemented.");
  }
  stats(): Stats {
    throw new Error("Method not implemented.");
  }
  jetstreamManager(opts?: JetStreamOptions): Promise<JetStreamManager> {
    throw new Error("Method not implemented.");
  }
  jetstream(opts?: JetStreamOptions): JetStreamClient {
    throw new Error("Method not implemented.");
  }
  rtt(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}

export function connect(opts?: ConnectionOptions): Promise<NatsConnection> {
  return new Promise<NatsConnection>((resolve) => {
    resolve(new NatsConnection());
  });
}
