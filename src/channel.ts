export interface Buffer<T> {
  put(value: T): Promise<void>;
  take(): T | undefined;
}

export class FixedBuffer<T> implements Buffer<T> {
  protected resolve?: () => void;
  protected buffer: T[] = [];
  constructor(protected length: number = 1) {}
  async put(value: T): Promise<void> {
    if (this.buffer.length < this.length) {
      this.buffer.push(value);
    }
    if (this.buffer.length < this.length) {
      return Promise.resolve();
    } else if (this.resolve != null) {
      return Promise.reject(new Error("Full buffer"));
    }
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  take(): T | undefined {
    const result = this.buffer.shift();
    if (this.resolve != null) {
      this.resolve();
      delete this.resolve;
    }
    return result;
  }
}

export class DroppingBuffer<T> implements Buffer<T> {
  protected buffer: T[] = [];
  constructor(protected length: number = 1) {}
  async put(value: T): Promise<void> {
    if (this.buffer.length < this.length) {
      this.buffer.push(value);
    }
  }

  take(): T | undefined {
    return this.buffer.shift();
  }
}

export class SlidingBuffer<T> implements Buffer<T> {
  protected buffer: T[] = [];
  constructor(protected length: number = 1) {}
  async put(value: T): Promise<void> {
    if (this.buffer.length >= this.length) {
      this.buffer.shift();
    }
    this.buffer.push(value);
  }

  take(): T | undefined {
    return this.buffer.shift();
  }
}

export class Channel<T> implements AsyncIterableIterator<T> {
  onclose?: (this: this) => void;
  public closed = false;
  protected resolve?: (value: IteratorResult<T>) => void;
  protected readonly done: IteratorResult<T> = {
    value: (undefined as unknown) as T,
    done: true,
  };

  constructor(protected buffer: Buffer<T> = new FixedBuffer(1)) {}

  put(value: T): Promise<void> {
    if (this.closed) {
      return Promise.reject(new Error("Cannot put to closed channel"));
    } else if (this.resolve != null) {
      this.resolve({ value, done: false });
      delete this.resolve;
      return Promise.resolve();
    }
    return this.buffer.put(value);
  }

  close(): void {
    this.closed = true;
    if (this.resolve != null) {
      this.resolve({ ...this.done });
      delete this.resolve;
    }
    if (this.onclose != null) {
      this.onclose();
      delete this.onclose;
    }
  }

  next(): Promise<IteratorResult<T>> {
    if (this.closed) {
      return Promise.resolve({ ...this.done });
    } else if (this.resolve != null) {
      return Promise.reject(new Error("Already taking value from iterator"));
    }
    const value = this.buffer.take();
    return new Promise((resolve) => {
      if (value == null) {
        this.resolve = resolve;
      } else {
        resolve({ value, done: false });
      }
    });
  }

  return(): Promise<IteratorResult<T>> {
    this.close();
    return Promise.resolve({ ...this.done });
  }

  throw(error: Error): Promise<IteratorResult<T>> {
    this.close();
    return Promise.reject(error);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
