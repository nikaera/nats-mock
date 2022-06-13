import { TextEncoder } from "node:util";
import { connect } from "nats";

describe("nats-mock tests", () => {
  describe("pubsub tests", () => {
    test("succeeded", async () => {
      const natsConnection = await connect();
      const channels = new Set([
        "test-channel-1",
        "test-channel-2",
        "test-channel-3",
      ]);

      const encoder = new TextEncoder();
      const promises = Array<Promise<void>>();

      for (const channel of channels) {
        const pubMessages = new Set([
          "test-message-1",
          "test-message-2",
          "test-message-3",
        ]);
        const sub = natsConnection.subscribe(channel);

        promises.push(
          (async () => {
            for await (const m of sub) {
              const message = Buffer.from(m.data).toString("utf8");

              expect(pubMessages.has(message)).toBe(true);
              pubMessages.delete(message);

              if (pubMessages.size === 0) sub.unsubscribe();
            }
          })()
        );

        for (const m of pubMessages) {
          natsConnection.publish(channel, encoder.encode(m));
        }
      }

      await Promise.all(promises);
      await natsConnection.close();
    });

    test("failed", async () => {
      const natsConnection = await connect();
      const channel = "test-channel";

      const sub = natsConnection.subscribe(channel);

      const encoder = new TextEncoder();
      const pubMessages = new Set([
        "test-message-1",
        "test-message-2",
        "test-message-3",
      ]);

      let counter = 0;
      const done = (async () => {
        for await (const m of sub) {
          counter++;
        }
      })();

      let pubCounter = 0;
      for (const m of pubMessages) {
        natsConnection.publish(channel, encoder.encode(m));
        sub.unsubscribe();

        pubCounter++;
      }
      expect(pubCounter).toBe(pubMessages.size);

      await done;
      await natsConnection.close();

      expect(counter).toBe(1);
    });
  });

  describe("connection tests", () => {
    test("wait for the connection to close", async () => {
      const natsConnection = await connect();

      setTimeout(() => {
        (async () => {
          await natsConnection.close();
        })().catch((e) => {
          throw e;
        });
      }, 10);
      expect(natsConnection.isClosed()).toBe(false);

      await natsConnection.closed();
      expect(natsConnection.isClosed()).toBe(true);
    });

    test("subscription stops when the connection is closed", async () => {
      const natsConnection = await connect();
      const channel = "test-channel";

      const sub = natsConnection.subscribe(channel);

      const encoder = new TextEncoder();
      const pubMessages = new Set([
        "test-message-1",
        "test-message-2",
        "test-message-3",
      ]);

      let counter = 0;
      const done = (async () => {
        for await (const m of sub) {
          counter++;
        }
      })();

      let pubCounter = 0;
      for (const m of pubMessages) {
        natsConnection.publish(channel, encoder.encode(m));
        await natsConnection.close();

        pubCounter++;
      }
      expect(pubCounter).toBe(pubMessages.size);

      await done;
      await natsConnection.closed();

      expect(counter).toBe(1);
    });
  });
});
