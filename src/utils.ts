export function timeout<T>(
  delay: number = 0,
  promise?: Promise<T>,
): Promise<T | undefined> {
  const timeout: Promise<undefined> = new Promise((resolve) =>
    setTimeout(resolve, delay),
  );
  if (promise == null) {
    return timeout;
  }
  return Promise.race([timeout, promise]);
}
