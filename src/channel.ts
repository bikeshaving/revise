// TODO:: close buffers
export interface Buffer<T> {
  put(value: T): Promise<void>;
  take(): T | undefined;
}

export class FixedBuffer<T> implements Buffer<T> {
  protected resolve?: () => void;
  protected reject?: (error: Error) => void;
  protected buffer: T[] = [];
  constructor(protected length: number = 1) {}
  async put(value: T): Promise<void> {
    if (this.buffer.length < this.length) {
      this.buffer.push(value);
    }
    if (this.buffer.length < this.length) {
      return Promise.resolve();
    } else if (this.reject != null) {
      this.reject(new Error("Full buffer"));
    }
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  take(): T | undefined {
    const result = this.buffer.shift();
    if (this.resolve != null) {
      this.resolve();
      delete this.resolve;
      delete this.reject;
    }
    return result;
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

export class Channel<T> implements AsyncIterableIterator<T> {
  onclose?: () => void;
  protected closed = false;
  protected resolve?: (value: IteratorResult<T>) => void;
  protected reject?: (error: Error) => void;
  protected done: IteratorResult<T> = {
    value: (undefined as unknown) as T,
    done: true,
  };

  constructor(protected buffer?: Buffer<T>) {}

  async push(value: T): Promise<void> {
    if (this.resolve != null) {
      this.resolve({ value, done: false });
      delete this.resolve;
      delete this.reject;
    } else if (this.buffer != null) {
      return this.buffer.put(value);
    }
  }

  protected pull(): Promise<IteratorResult<T>> {
    if (this.reject != null) {
      this.reject(new Error("Cannot pull more than one value at a time"));
      delete this.resolve;
      delete this.reject;
    }
    return new Promise((resolve, reject) => {
      const value = this.buffer && this.buffer.take();
      if (value == null) {
        this.resolve = resolve;
        this.reject = reject;
      } else {
        resolve({ value, done: false });
      }
    });
  }

  close(): void {
    this.closed = true;
    if (this.resolve != null) {
      this.resolve({ ...this.done });
      delete this.resolve;
      delete this.reject;
    }
    if (this.onclose != null) {
      this.onclose();
      delete this.onclose;
    }
    // this.buffer.close();
    delete this.buffer;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.closed) {
      return { ...this.done };
    }
    return this.pull();
  }

  async return(): Promise<IteratorResult<T>> {
    this.close();
    return { ...this.done };
  }

  async throw(error: Error): Promise<IteratorResult<T>> {
    this.close();
    throw error;
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
