import { FixedBuffer } from "../channel";
describe("FixedBuffer", () => {
  test("put", async () => {
    const buffer = new FixedBuffer<number>(2);
    await buffer.put(1000);
    expect(buffer.take()).toEqual(1000);
    expect(buffer.take()).toEqual(undefined);
  });

  test("throws when full", async () => {
    const buffer = new FixedBuffer<number>(2);
    buffer.put(1000);
    buffer.put(69);
  });
});
