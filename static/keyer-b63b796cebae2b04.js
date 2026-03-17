// ../dist/src/keyer.js
var Keyer = class {
  nextKey;
  keys;
  constructor() {
    this.nextKey = 0;
    this.keys = /* @__PURE__ */ new Map();
  }
  keyAt(i) {
    if (!this.keys.has(i)) {
      this.keys.set(i, this.nextKey++);
    }
    return this.keys.get(i);
  }
  transform(edit) {
    const operations = edit.operations();
    for (let i = operations.length - 1; i >= 0; i--) {
      const op = operations[i];
      switch (op.type) {
        case "delete": {
          for (let j = op.start + 1; j <= op.end; j++) {
            this.keys.delete(j);
          }
          this.keys = adjustKeysAfterDelete(
            this.keys,
            op.start,
            op.end - op.start
          );
          break;
        }
        case "insert": {
          this.keys = shiftKeysAfterInsert(
            this.keys,
            op.start,
            op.value.length
          );
          break;
        }
      }
    }
  }
};
function adjustKeysAfterDelete(keys, start, length) {
  const newKeys = /* @__PURE__ */ new Map();
  keys.forEach((value, key) => {
    if (key > start) {
      newKeys.set(key - length, value);
    } else {
      newKeys.set(key, value);
    }
  });
  return newKeys;
}
function shiftKeysAfterInsert(keys, start, length) {
  const newKeys = /* @__PURE__ */ new Map();
  keys.forEach((value, key) => {
    if (key >= start) {
      newKeys.set(key + length, value);
    } else {
      newKeys.set(key, value);
    }
  });
  return newKeys;
}
export {
  Keyer
};
