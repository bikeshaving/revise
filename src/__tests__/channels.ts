import {
  FixedBuffer,
  SlidingBuffer,
  DroppingBuffer,
  Channel,
} from "../channel";

describe("FixedBuffer", () => {
  test("fixed", () => {
    const buffer = new FixedBuffer<number>(2);
    buffer.put(1);
    buffer.put(2);
    expect(buffer.take()).toEqual(1);
    expect(buffer.take()).toEqual(2);
    expect(buffer.take()).toEqual(undefined);
  });

  test("waits when full", async () => {
    const buffer = new FixedBuffer<number>(3);
    buffer.put(1);
    buffer.put(2);
    setTimeout(() => {
      expect(buffer.take()).toEqual(1);
    });
    await expect(buffer.put(3)).resolves.toBeUndefined();
    buffer.put(4);
  });

  test("throws when full", async () => {
    const buffer = new FixedBuffer<number>(2);
    buffer.put(1);
    buffer.put(2);
    await expect(buffer.put(3)).rejects.toBeDefined();
  });
});

describe("SlidingBuffer", () => {
  test("slides", () => {
    const buffer = new SlidingBuffer<number>(2);
    buffer.put(1);
    buffer.put(2);
    buffer.put(3);
    expect(buffer.take()).toEqual(2);
    expect(buffer.take()).toEqual(3);
    expect(buffer.take()).toEqual(undefined);
  });
});

describe("DroppingBuffer", () => {
  test("drops", () => {
    const buffer = new DroppingBuffer<number>(2);
    buffer.put(1);
    buffer.put(2);
    buffer.put(3);
    expect(buffer.take()).toEqual(1);
    expect(buffer.take()).toEqual(2);
    expect(buffer.take()).toEqual(undefined);
  });
});

describe("Channel", () => {
  test("no buffer", async () => {
    const channel = new Channel<number>();
    setTimeout(async () => {
      await channel.put(1);
      await channel.put(2);
      await channel.put(3);
      await channel.put(4);
      await channel.put(5);
      channel.close();
    });
    const result: number[] = [];
    for await (const num of channel) {
      result.push(num);
    }
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test("fixed buffer", async () => {
    const channel = new Channel(new FixedBuffer<number>(3));
    channel.put(1);
    channel.put(2);
    channel.put(3);
    await expect(channel.put(4)).rejects.toBeDefined();
  });

  test("dropping buffer", async () => {
    const channel = new Channel(new DroppingBuffer<number>(3));
    channel.put(1);
    channel.put(2);
    channel.put(3);
    channel.put(4);
    channel.put(5);
    let i = 1;
    for await (const num of channel) {
      expect(num).toEqual(i++);
      if (i === 4) {
        break;
      }
    }
    expect(channel.closed).toBe(true);
  });

  test("sliding buffer", async () => {
    const channel = new Channel(new SlidingBuffer<number>(3));
    channel.put(1);
    channel.put(2);
    channel.put(3);
    channel.put(4);
    channel.put(5);
    let i = 3;
    for await (const num of channel) {
      expect(num).toEqual(i++);
      if (i === 6) {
        break;
      }
    }
    expect(channel.closed).toBe(true);
  });

  test("throws pulling multiple values", async () => {
    const channel = new Channel<number>();
    setTimeout(async () => {
      await channel.put(1);
      await channel.put(2);
      await channel.put(3);
    });
    let result = channel.next();
    expect(await result).toEqual({ value: 1, done: false });
    await Promise.all([
      expect(channel.next()).resolves.toEqual({ value: 2, done: false }),
      expect(channel.next()).rejects.toBeDefined(),
    ]);
  });

  test("early break", async () => {
    const channel = new Channel<number>();
    const puts = (async () => {
      await channel.put(1);
      await channel.put(2);
      return channel.put(3);
    })();
    let i = 1;
    for await (const num of channel) {
      expect(num).toEqual(i++);
      if (i === 3) {
        break;
      }
    }
    await expect(puts).rejects.toBeDefined();
    expect(channel.closed).toBe(true);
  });

  test("early throw", async () => {
    const channel = new Channel<number>();
    const puts = (async () => {
      await channel.put(1);
      await channel.put(2);
      return channel.put(3);
    })();
    let i = 1;
    const error = new Error("Example error");
    try {
      for await (const num of channel) {
        expect(num).toEqual(i++);
        if (i === 3) {
          throw error;
        }
      }
    } catch (err) {
      expect(err).toEqual(error);
    }
    await expect(puts).rejects.toBeDefined();
    expect(channel.closed).toBe(true);
  });

  test("throw", async () => {
    const channel = new Channel<number>();
    const error = new Error("Example error");
    const puts = (async () => {
      await channel.put(1);
      await channel.put(2);
      await channel.put(3);
      try {
        await channel.throw(error);
      } catch (err) {
        expect(err).toEqual(error);
      }
      return channel.put(4);
    })();
    let result: number[] = [];
    for await (const num of channel) {
      result.push(num);
    }
    expect(result).toEqual([1, 2, 3]);
    await expect(puts).rejects.toBeDefined();
    expect(channel.closed).toBe(true);
  });
});
