// ../packages/crankeditable/node_modules/@b9g/crank/event-target.js
var NONE = 0;
var CAPTURING_PHASE = 1;
var AT_TARGET = 2;
var BUBBLING_PHASE = 3;
function isEventTarget(value) {
  return value != null && typeof value.addEventListener === "function" && typeof value.removeEventListener === "function" && typeof value.dispatchEvent === "function";
}
function setEventProperty(ev, key, value) {
  Object.defineProperty(ev, key, { value, writable: false, configurable: true });
}
function isListenerOrListenerObject(value) {
  return typeof value === "function" || value !== null && typeof value === "object" && typeof value.handleEvent === "function";
}
function normalizeListenerOptions(options) {
  if (typeof options === "boolean") {
    return { capture: options };
  } else if (options == null) {
    return {};
  }
  return options;
}
var _parent = /* @__PURE__ */ Symbol.for("CustomEventTarget.parent");
var _listeners = /* @__PURE__ */ Symbol.for("CustomEventTarget.listeners");
var _delegates = /* @__PURE__ */ Symbol.for("CustomEventTarget.delegates");
var _dispatchEventOnSelf = /* @__PURE__ */ Symbol.for("CustomEventTarget.dispatchSelf");
var CustomEventTarget = class {
  constructor(parent = null) {
    this[_parent] = parent;
    this[_listeners] = [];
    this[_delegates] = /* @__PURE__ */ new Set();
  }
  addEventListener(type, listener, options) {
    if (!isListenerOrListenerObject(listener)) {
      return;
    }
    const listeners = this[_listeners];
    options = normalizeListenerOptions(options);
    let callback;
    if (typeof listener === "function") {
      callback = listener;
    } else {
      callback = (ev) => listener.handleEvent(ev);
    }
    const record = { type, listener, callback, options };
    if (options.once) {
      record.callback = function() {
        const i = listeners.indexOf(record);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
        return callback.apply(this, arguments);
      };
    }
    if (listeners.some((record1) => record.type === record1.type && record.listener === record1.listener && !record.options.capture === !record1.options.capture)) {
      return;
    }
    listeners.push(record);
    for (const delegate of this[_delegates]) {
      delegate.addEventListener(type, record.callback, record.options);
    }
  }
  removeEventListener(type, listener, options) {
    const listeners = this[_listeners];
    if (listeners == null || !isListenerOrListenerObject(listener)) {
      return;
    }
    const options1 = normalizeListenerOptions(options);
    const i = listeners.findIndex((record2) => record2.type === type && record2.listener === listener && !record2.options.capture === !options1.capture);
    if (i === -1) {
      return;
    }
    const record = listeners[i];
    listeners.splice(i, 1);
    for (const delegate of this[_delegates]) {
      delegate.removeEventListener(record.type, record.callback, record.options);
    }
  }
  dispatchEvent(ev) {
    const path = [];
    for (let parent = this[_parent]; parent; parent = parent[_parent]) {
      path.push(parent);
    }
    let cancelBubble = false;
    let immediateCancelBubble = false;
    const stopPropagation = ev.stopPropagation;
    setEventProperty(ev, "stopPropagation", () => {
      cancelBubble = true;
      return stopPropagation.call(ev);
    });
    const stopImmediatePropagation = ev.stopImmediatePropagation;
    setEventProperty(ev, "stopImmediatePropagation", () => {
      immediateCancelBubble = true;
      return stopImmediatePropagation.call(ev);
    });
    setEventProperty(ev, "target", this);
    try {
      setEventProperty(ev, "eventPhase", CAPTURING_PHASE);
      for (let i = path.length - 1; i >= 0; i--) {
        const target = path[i];
        const listeners = target[_listeners];
        setEventProperty(ev, "currentTarget", target);
        for (let i2 = 0; i2 < listeners.length; i2++) {
          const record = listeners[i2];
          if (record.type === ev.type && record.options.capture) {
            try {
              record.callback.call(target, ev);
            } catch (err) {
              console.error(err);
            }
            if (immediateCancelBubble) {
              return true;
            }
          }
        }
        if (cancelBubble) {
          return true;
        }
      }
      {
        setEventProperty(ev, "eventPhase", AT_TARGET);
        setEventProperty(ev, "currentTarget", this);
        this[_dispatchEventOnSelf](ev);
        if (immediateCancelBubble) {
          return true;
        }
        const listeners = this[_listeners];
        for (let i = 0; i < listeners.length; i++) {
          const record = listeners[i];
          if (record.type === ev.type) {
            try {
              record.callback.call(this, ev);
            } catch (err) {
              console.error(err);
            }
            if (immediateCancelBubble) {
              return true;
            }
          }
        }
        if (cancelBubble) {
          return true;
        }
      }
      if (ev.bubbles) {
        setEventProperty(ev, "eventPhase", BUBBLING_PHASE);
        for (let i = 0; i < path.length; i++) {
          const target = path[i];
          setEventProperty(ev, "currentTarget", target);
          const listeners = target[_listeners];
          for (let i2 = 0; i2 < listeners.length; i2++) {
            const record = listeners[i2];
            if (record.type === ev.type && !record.options.capture) {
              try {
                record.callback.call(target, ev);
              } catch (err) {
                console.error(err);
              }
              if (immediateCancelBubble) {
                return true;
              }
            }
          }
          if (cancelBubble) {
            return true;
          }
        }
      }
    } finally {
      setEventProperty(ev, "eventPhase", NONE);
      setEventProperty(ev, "currentTarget", null);
      return !ev.defaultPrevented;
    }
  }
  [_dispatchEventOnSelf](_ev) {
  }
};
CustomEventTarget.dispatchEventOnSelf = _dispatchEventOnSelf;
function addEventTargetDelegates(target, delegates, include = (target1) => target === target1) {
  const delegates1 = delegates.filter(isEventTarget);
  for (let target1 = target; target1 && include(target1); target1 = target1[_parent]) {
    for (let i = 0; i < delegates1.length; i++) {
      const delegate = delegates1[i];
      if (target1[_delegates].has(delegate)) {
        continue;
      }
      target1[_delegates].add(delegate);
      for (const record of target1[_listeners]) {
        delegate.addEventListener(record.type, record.callback, record.options);
      }
    }
  }
}
function removeEventTargetDelegates(target, delegates, include = (target1) => target === target1) {
  const delegates1 = delegates.filter(isEventTarget);
  for (let target1 = target; target1 && include(target1); target1 = target1[_parent]) {
    for (let i = 0; i < delegates1.length; i++) {
      const delegate = delegates1[i];
      if (!target1[_delegates].has(delegate)) {
        continue;
      }
      target1[_delegates].delete(delegate);
      for (const record of target1[_listeners]) {
        delegate.removeEventListener(record.type, record.callback, record.options);
      }
    }
  }
}
function clearEventListeners(target) {
  const listeners = target[_listeners];
  const delegates = target[_delegates];
  for (let i = 0; i < listeners.length; i++) {
    const record = listeners[i];
    for (const delegate of delegates) {
      delegate.removeEventListener(record.type, record.callback, record.options);
    }
  }
  listeners.length = 0;
  delegates.clear();
}

// ../packages/crankeditable/node_modules/@b9g/crank/_utils.js
var supportsUserTiming = typeof performance !== "undefined" && typeof performance.mark === "function";
function markStart(label) {
  if (supportsUserTiming) {
    performance.mark("\u2699 " + label);
  }
}
function measureMark(label) {
  if (supportsUserTiming) {
    const name = "\u2699 " + label;
    try {
      performance.measure(name, name);
    } catch (_) {
    }
    performance.clearMarks(name);
  }
}
function wrap(value) {
  return value === void 0 ? [] : Array.isArray(value) ? value : [value];
}
function unwrap(arr) {
  return arr.length === 0 ? void 0 : arr.length === 1 ? arr[0] : arr;
}
function arrayify(value) {
  return value == null ? [] : Array.isArray(value) ? value : typeof value === "string" || typeof value[Symbol.iterator] !== "function" ? [value] : [...value];
}
function isIteratorLike(value) {
  return value != null && typeof value.next === "function";
}
function isPromiseLike(value) {
  return value != null && typeof value.then === "function";
}
function createRaceRecord(contender) {
  const deferreds = /* @__PURE__ */ new Set();
  const record = { deferreds, settled: false };
  Promise.resolve(contender).then((value) => {
    for (const { resolve } of deferreds) {
      resolve(value);
    }
    deferreds.clear();
    record.settled = true;
  }, (err) => {
    for (const { reject } of deferreds) {
      reject(err);
    }
    deferreds.clear();
    record.settled = true;
  });
  return record;
}
var wm = /* @__PURE__ */ new WeakMap();
function safeRace(contenders) {
  let deferred;
  const result = new Promise((resolve, reject) => {
    deferred = { resolve, reject };
    for (const contender of contenders) {
      if (!isPromiseLike(contender)) {
        Promise.resolve(contender).then(resolve, reject);
        continue;
      }
      let record = wm.get(contender);
      if (record === void 0) {
        record = createRaceRecord(contender);
        record.deferreds.add(deferred);
        wm.set(contender, record);
      } else if (record.settled) {
        Promise.resolve(contender).then(resolve, reject);
      } else {
        record.deferreds.add(deferred);
      }
    }
  });
  return result.finally(() => {
    for (const contender of contenders) {
      if (isPromiseLike(contender)) {
        const record = wm.get(contender);
        if (record) {
          record.deferreds.delete(deferred);
        }
      }
    }
  });
}

// ../packages/crankeditable/node_modules/@b9g/crank/crank.js
var NOOP = () => {
};
function getTagName(tag) {
  return typeof tag === "function" ? tag.name || "Anonymous" : typeof tag === "string" ? tag : (
    // tag is symbol, using else branch to avoid typeof tag === "symbol"
    tag.description || "Anonymous"
  );
}
var Fragment = "";
var Portal = /* @__PURE__ */ Symbol.for("crank.Portal");
var Copy = /* @__PURE__ */ Symbol.for("crank.Copy");
var Text = /* @__PURE__ */ Symbol.for("crank.Text");
var Raw = /* @__PURE__ */ Symbol.for("crank.Raw");
var ElementSymbol = /* @__PURE__ */ Symbol.for("crank.Element");
var Element = class {
  constructor(tag, props) {
    this.tag = tag;
    this.props = props;
  }
};
Element.prototype.$$typeof = ElementSymbol;
function isElement(value) {
  return value != null && value.$$typeof === ElementSymbol;
}
var DEPRECATED_PROP_PREFIXES = ["crank-", "c-", "$"];
var DEPRECATED_SPECIAL_PROP_BASES = ["key", "ref", "static", "copy"];
function createElement(tag, props, ...children) {
  if (props == null) {
    props = {};
  }
  if ("static" in props) {
    console.error(`The \`static\` prop is deprecated. Use \`copy\` instead.`);
    props["copy"] = props["static"];
    delete props["static"];
  }
  for (let i = 0; i < DEPRECATED_PROP_PREFIXES.length; i++) {
    const propPrefix = DEPRECATED_PROP_PREFIXES[i];
    for (let j = 0; j < DEPRECATED_SPECIAL_PROP_BASES.length; j++) {
      const propBase = DEPRECATED_SPECIAL_PROP_BASES[j];
      const deprecatedPropName = propPrefix + propBase;
      if (deprecatedPropName in props) {
        const targetPropBase = propBase === "static" ? "copy" : propBase;
        console.error(`The \`${deprecatedPropName}\` prop is deprecated. Use \`${targetPropBase}\` instead.`);
        props[targetPropBase] = props[deprecatedPropName];
        delete props[deprecatedPropName];
      }
    }
  }
  if (children.length > 1) {
    props.children = children;
  } else if (children.length === 1) {
    props.children = children[0];
  }
  return new Element(tag, props);
}
function cloneElement(el) {
  if (!isElement(el)) {
    throw new TypeError(`Cannot clone non-element: ${String(el)}`);
  }
  return new Element(el.tag, { ...el.props });
}
function narrow(value) {
  if (typeof value === "boolean" || value == null) {
    return;
  } else if (typeof value === "string" || isElement(value)) {
    return value;
  } else if (typeof value[Symbol.iterator] === "function") {
    return createElement(Fragment, null, value);
  }
  return value.toString();
}
var DidDiff = 1 << 0;
var DidCommit = 1 << 1;
var IsCopied = 1 << 2;
var IsUpdating = 1 << 3;
var IsExecuting = 1 << 4;
var IsRefreshing = 1 << 5;
var IsScheduling = 1 << 6;
var IsSchedulingFallback = 1 << 7;
var IsUnmounted = 1 << 8;
var IsErrored = 1 << 9;
var IsResurrecting = 1 << 10;
var IsSyncGen = 1 << 11;
var IsAsyncGen = 1 << 12;
var IsInForOfLoop = 1 << 13;
var IsInForAwaitOfLoop = 1 << 14;
var NeedsToYield = 1 << 15;
var PropsAvailable = 1 << 16;
var IsSchedulingRefresh = 1 << 17;
function getFlag(ret, flag) {
  return !!(ret.f & flag);
}
function setFlag(ret, flag, value = true) {
  if (value) {
    ret.f |= flag;
  } else {
    ret.f &= ~flag;
  }
}
var Retainer = class {
  constructor(el) {
    this.f = 0;
    this.el = el;
    this.ctx = void 0;
    this.children = void 0;
    this.fallback = void 0;
    this.value = void 0;
    this.oldProps = void 0;
    this.pendingDiff = void 0;
    this.onNextDiff = void 0;
    this.graveyard = void 0;
    this.lingerers = void 0;
  }
};
function cloneRetainer(ret) {
  const clone = new Retainer(ret.el);
  clone.f = ret.f;
  clone.ctx = ret.ctx;
  clone.children = ret.children;
  clone.fallback = ret.fallback;
  clone.value = ret.value;
  clone.scope = ret.scope;
  clone.oldProps = ret.oldProps;
  clone.pendingDiff = ret.pendingDiff;
  clone.onNextDiff = ret.onNextDiff;
  clone.graveyard = ret.graveyard;
  clone.lingerers = ret.lingerers;
  return clone;
}
function getValue(ret, isNested = false, index) {
  if (getFlag(ret, IsScheduling) && isNested) {
    return ret.fallback ? getValue(ret.fallback, isNested, index) : void 0;
  } else if (ret.fallback && !getFlag(ret, DidDiff)) {
    return ret.fallback ? getValue(ret.fallback, isNested, index) : ret.fallback;
  } else if (ret.el.tag === Portal) {
    return;
  } else if (ret.el.tag === Fragment || typeof ret.el.tag === "function") {
    if (index != null && ret.ctx) {
      ret.ctx.index = index;
    }
    return unwrap(getChildValues(ret, index));
  }
  return ret.value;
}
function getChildValues(ret, startIndex) {
  const values = [];
  const lingerers = ret.lingerers;
  const rawChildren = ret.children;
  const isChildrenArray = Array.isArray(rawChildren);
  const childrenLength = rawChildren === void 0 ? 0 : isChildrenArray ? rawChildren.length : 1;
  let currentIndex = startIndex;
  for (let i = 0; i < childrenLength; i++) {
    if (lingerers != null && lingerers[i] != null) {
      const rets = lingerers[i];
      for (const ret2 of rets) {
        const value = getValue(ret2, true, currentIndex);
        if (Array.isArray(value)) {
          for (let j = 0; j < value.length; j++) {
            values.push(value[j]);
          }
          if (currentIndex != null) {
            currentIndex += value.length;
          }
        } else if (value) {
          values.push(value);
          if (currentIndex != null) {
            currentIndex++;
          }
        }
      }
    }
    const child = isChildrenArray ? rawChildren[i] : rawChildren;
    if (child) {
      const value = getValue(child, true, currentIndex);
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          values.push(value[j]);
        }
        if (currentIndex != null) {
          currentIndex += value.length;
        }
      } else if (value) {
        values.push(value);
        if (currentIndex != null) {
          currentIndex++;
        }
      }
    }
  }
  if (lingerers != null && lingerers.length > childrenLength) {
    for (let i = childrenLength; i < lingerers.length; i++) {
      const rets = lingerers[i];
      if (rets != null) {
        for (const ret2 of rets) {
          const value = getValue(ret2, true, currentIndex);
          if (Array.isArray(value)) {
            for (let j = 0; j < value.length; j++) {
              values.push(value[j]);
            }
            if (currentIndex != null) {
              currentIndex += value.length;
            }
          } else if (value) {
            values.push(value);
            if (currentIndex != null) {
              currentIndex++;
            }
          }
        }
      }
    }
  }
  return values;
}
function stripSpecialProps(props) {
  let _;
  let result;
  ({ key: _, ref: _, copy: _, hydrate: _, children: _, ...result } = props);
  return result;
}
function diffChild(adapter, root, host, ctx, scope, parent, newChildren) {
  let child = narrow(newChildren);
  let ret = parent.children;
  let graveyard;
  let diff2;
  if (typeof child === "object") {
    let childCopied = false;
    const oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
    const newKey = child.props.key;
    if (oldKey !== newKey) {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = void 0;
    }
    if (child.tag === Copy) {
      childCopied = true;
    } else if (typeof ret === "object" && ret.el === child && getFlag(ret, DidCommit)) {
      childCopied = true;
    } else {
      if (ret && ret.el.tag === child.tag) {
        ret.el = child;
        if (child.props.copy && typeof child.props.copy !== "string") {
          childCopied = true;
        }
      } else if (ret) {
        let candidateFound = false;
        for (let predecessor = ret, candidate = ret.fallback; candidate; predecessor = candidate, candidate = candidate.fallback) {
          if (candidate.el.tag === child.tag) {
            const clone = cloneRetainer(candidate);
            setFlag(clone, IsResurrecting);
            predecessor.fallback = clone;
            const fallback = ret;
            ret = candidate;
            ret.el = child;
            ret.fallback = fallback;
            setFlag(ret, DidDiff, false);
            candidateFound = true;
            break;
          }
        }
        if (!candidateFound) {
          const fallback = ret;
          ret = new Retainer(child);
          ret.fallback = fallback;
        }
      } else {
        ret = new Retainer(child);
      }
      if (childCopied && getFlag(ret, DidCommit)) ;
      else if (child.tag === Raw || child.tag === Text) ;
      else if (child.tag === Fragment) {
        diff2 = diffChildren(adapter, root, host, ctx, scope, ret, ret.el.props.children);
      } else if (typeof child.tag === "function") {
        diff2 = diffComponent(adapter, root, host, ctx, scope, ret);
      } else {
        diff2 = diffHost(adapter, root, ctx, scope, ret);
      }
    }
    if (typeof ret === "object") {
      if (childCopied) {
        setFlag(ret, IsCopied);
        diff2 = getInflightDiff(ret);
      } else {
        setFlag(ret, IsCopied, false);
      }
    }
  } else if (typeof child === "string") {
    if (typeof ret === "object" && ret.el.tag === Text) {
      ret.el.props.value = child;
    } else {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = new Retainer(createElement(Text, { value: child }));
    }
  } else {
    if (typeof ret === "object") {
      (graveyard = graveyard || []).push(ret);
    }
    ret = void 0;
  }
  parent.children = ret;
  if (isPromiseLike(diff2)) {
    const diff1 = diff2.finally(() => {
      setFlag(parent, DidDiff);
      if (graveyard) {
        if (parent.graveyard) {
          for (let i = 0; i < graveyard.length; i++) {
            parent.graveyard.push(graveyard[i]);
          }
        } else {
          parent.graveyard = graveyard;
        }
      }
    });
    let onNextDiffs;
    const diff22 = parent.pendingDiff = safeRace([
      diff1,
      new Promise((resolve) => onNextDiffs = resolve)
    ]);
    if (parent.onNextDiff) {
      parent.onNextDiff(diff22);
    }
    parent.onNextDiff = onNextDiffs;
    return diff22;
  } else {
    setFlag(parent, DidDiff);
    if (graveyard) {
      if (parent.graveyard) {
        for (let i = 0; i < graveyard.length; i++) {
          parent.graveyard.push(graveyard[i]);
        }
      } else {
        parent.graveyard = graveyard;
      }
    }
    if (parent.onNextDiff) {
      parent.onNextDiff(diff2);
      parent.onNextDiff = void 0;
    }
    parent.pendingDiff = void 0;
  }
}
function diffChildren(adapter, root, host, ctx, scope, parent, newChildren) {
  if (!Array.isArray(newChildren) && (typeof newChildren !== "object" || newChildren === null || typeof newChildren[Symbol.iterator] !== "function") && !Array.isArray(parent.children)) {
    return diffChild(adapter, root, host, ctx, scope, parent, newChildren);
  }
  const oldRetained = wrap(parent.children);
  const newRetained = [];
  const newChildren1 = arrayify(newChildren);
  const diffs = [];
  let childrenByKey;
  let seenKeys;
  let isAsync = false;
  let oi = 0;
  let oldLength = oldRetained.length;
  let graveyard;
  for (let ni = 0, newLength = newChildren1.length; ni < newLength; ni++) {
    let ret = oi >= oldLength ? void 0 : oldRetained[oi];
    let child = narrow(newChildren1[ni]);
    {
      let oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
      let newKey = typeof child === "object" ? child.props.key : void 0;
      if (newKey !== void 0 && seenKeys && seenKeys.has(newKey)) {
        console.error(`Duplicate key found in <${getTagName(parent.el.tag)}>`, newKey);
        child = cloneElement(child);
        newKey = child.props.key = void 0;
      }
      if (oldKey === newKey) {
        if (childrenByKey !== void 0 && newKey !== void 0) {
          childrenByKey.delete(newKey);
        }
        oi++;
      } else {
        childrenByKey = childrenByKey || createChildrenByKey(oldRetained, oi);
        if (newKey === void 0) {
          while (ret !== void 0 && oldKey !== void 0) {
            oi++;
            ret = oldRetained[oi];
            oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
          }
          oi++;
        } else {
          ret = childrenByKey.get(newKey);
          if (ret !== void 0) {
            childrenByKey.delete(newKey);
          }
          (seenKeys = seenKeys || /* @__PURE__ */ new Set()).add(newKey);
        }
      }
    }
    let diff2 = void 0;
    if (typeof child === "object") {
      let childCopied = false;
      if (child.tag === Copy) {
        childCopied = true;
      } else if (typeof ret === "object" && ret.el === child && getFlag(ret, DidCommit)) {
        childCopied = true;
      } else {
        if (ret && ret.el.tag === child.tag) {
          ret.el = child;
          if (child.props.copy && typeof child.props.copy !== "string") {
            childCopied = true;
          }
        } else if (ret) {
          let candidateFound = false;
          for (let predecessor = ret, candidate = ret.fallback; candidate; predecessor = candidate, candidate = candidate.fallback) {
            if (candidate.el.tag === child.tag) {
              const clone = cloneRetainer(candidate);
              setFlag(clone, IsResurrecting);
              predecessor.fallback = clone;
              const fallback = ret;
              ret = candidate;
              ret.el = child;
              ret.fallback = fallback;
              setFlag(ret, DidDiff, false);
              candidateFound = true;
              break;
            }
          }
          if (!candidateFound) {
            const fallback = ret;
            ret = new Retainer(child);
            ret.fallback = fallback;
          }
        } else {
          ret = new Retainer(child);
        }
        if (childCopied && getFlag(ret, DidCommit)) ;
        else if (child.tag === Raw || child.tag === Text) ;
        else if (child.tag === Fragment) {
          diff2 = diffChildren(adapter, root, host, ctx, scope, ret, ret.el.props.children);
        } else if (typeof child.tag === "function") {
          diff2 = diffComponent(adapter, root, host, ctx, scope, ret);
        } else {
          diff2 = diffHost(adapter, root, ctx, scope, ret);
        }
      }
      if (typeof ret === "object") {
        if (childCopied) {
          setFlag(ret, IsCopied);
          diff2 = getInflightDiff(ret);
        } else {
          setFlag(ret, IsCopied, false);
        }
      }
      if (isPromiseLike(diff2)) {
        isAsync = true;
      }
    } else if (typeof child === "string") {
      if (typeof ret === "object" && ret.el.tag === Text) {
        ret.el.props.value = child;
      } else {
        if (typeof ret === "object") {
          (graveyard = graveyard || []).push(ret);
        }
        ret = new Retainer(createElement(Text, { value: child }));
      }
    } else {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = void 0;
    }
    diffs[ni] = diff2;
    newRetained[ni] = ret;
  }
  for (; oi < oldLength; oi++) {
    const ret = oldRetained[oi];
    if (typeof ret === "object" && (typeof ret.el.props.key === "undefined" || !seenKeys || !seenKeys.has(ret.el.props.key))) {
      (graveyard = graveyard || []).push(ret);
    }
  }
  if (childrenByKey !== void 0 && childrenByKey.size > 0) {
    graveyard = graveyard || [];
    for (const ret of childrenByKey.values()) {
      graveyard.push(ret);
    }
  }
  parent.children = unwrap(newRetained);
  if (isAsync) {
    const diffs1 = Promise.all(diffs).then(() => void 0).finally(() => {
      setFlag(parent, DidDiff);
      if (graveyard) {
        if (parent.graveyard) {
          for (let i = 0; i < graveyard.length; i++) {
            parent.graveyard.push(graveyard[i]);
          }
        } else {
          parent.graveyard = graveyard;
        }
      }
    });
    let onNextDiffs;
    const diffs2 = parent.pendingDiff = safeRace([
      diffs1,
      new Promise((resolve) => onNextDiffs = resolve)
    ]);
    if (parent.onNextDiff) {
      parent.onNextDiff(diffs2);
    }
    parent.onNextDiff = onNextDiffs;
    return diffs2;
  } else {
    setFlag(parent, DidDiff);
    if (graveyard) {
      if (parent.graveyard) {
        for (let i = 0; i < graveyard.length; i++) {
          parent.graveyard.push(graveyard[i]);
        }
      } else {
        parent.graveyard = graveyard;
      }
    }
    if (parent.onNextDiff) {
      parent.onNextDiff(diffs);
      parent.onNextDiff = void 0;
    }
    parent.pendingDiff = void 0;
  }
}
function getInflightDiff(ret) {
  if (ret.ctx && ret.ctx.inflight) {
    return ret.ctx.inflight[1];
  } else if (ret.pendingDiff) {
    return ret.pendingDiff;
  }
}
function createChildrenByKey(children, offset) {
  const childrenByKey = /* @__PURE__ */ new Map();
  for (let i = offset; i < children.length; i++) {
    const child = children[i];
    if (typeof child === "object" && typeof child.el.props.key !== "undefined") {
      childrenByKey.set(child.el.props.key, child);
    }
  }
  return childrenByKey;
}
function diffHost(adapter, root, ctx, scope, ret) {
  const el = ret.el;
  const tag = el.tag;
  if (el.tag === Portal) {
    root = ret.value = el.props.root;
  }
  if (getFlag(ret, DidCommit)) {
    scope = ret.scope;
  } else {
    scope = ret.scope = adapter.scope({
      tag,
      tagName: getTagName(tag),
      props: el.props,
      scope,
      root
    });
  }
  return diffChildren(adapter, root, ret, ctx, scope, ret, ret.el.props.children);
}
function commit(adapter, host, ret, ctx, scope, root, index, schedulePromises, hydrationNodes) {
  if (getFlag(ret, IsCopied) && getFlag(ret, DidCommit)) {
    return getValue(ret);
  }
  const el = ret.el;
  const tag = el.tag;
  if (typeof tag === "function" || tag === Fragment || tag === Portal || tag === Raw || tag === Text) {
    if (typeof el.props.copy === "string") {
      console.error(`String copy prop ignored for <${getTagName(tag)}>. Use booleans instead.`);
    }
    if (typeof el.props.hydrate === "string") {
      console.error(`String hydrate prop ignored for <${getTagName(tag)}>. Use booleans instead.`);
    }
  }
  let value;
  let skippedHydrationNodes;
  if (hydrationNodes && el.props.hydrate != null && !el.props.hydrate && typeof el.props.hydrate !== "string") {
    skippedHydrationNodes = hydrationNodes;
    hydrationNodes = void 0;
  }
  if (typeof tag === "function") {
    ret.ctx.index = index;
    value = commitComponent(ret.ctx, schedulePromises, hydrationNodes);
  } else {
    if (tag === Fragment) {
      value = commitChildren(adapter, host, ctx, scope, root, ret, index, schedulePromises, hydrationNodes);
    } else if (tag === Text) {
      value = commitText(adapter, ret, el, scope, hydrationNodes, root);
    } else if (tag === Raw) {
      value = commitRaw(adapter, host, ret, scope, hydrationNodes, root);
    } else {
      value = commitHost(adapter, ret, ctx, root, schedulePromises, hydrationNodes);
    }
    if (ret.fallback) {
      unmount(adapter, host, ctx, root, ret.fallback, false);
      ret.fallback = void 0;
    }
  }
  if (skippedHydrationNodes) {
    skippedHydrationNodes.splice(0, value == null ? 0 : Array.isArray(value) ? value.length : 1);
  }
  if (!getFlag(ret, DidCommit)) {
    setFlag(ret, DidCommit);
    if (typeof tag !== "function" && tag !== Fragment && tag !== Portal && typeof el.props.ref === "function") {
      el.props.ref(adapter.read(value));
    }
  }
  return value;
}
function commitChildren(adapter, host, ctx, scope, root, parent, index, schedulePromises, hydrationNodes) {
  let values = [];
  const rawChildren = parent.children;
  const isChildrenArray = Array.isArray(rawChildren);
  const childrenLength = rawChildren === void 0 ? 0 : isChildrenArray ? rawChildren.length : 1;
  for (let i = 0; i < childrenLength; i++) {
    let child = isChildrenArray ? rawChildren[i] : rawChildren;
    let schedulePromises1;
    let isSchedulingFallback = false;
    while (child && (!getFlag(child, DidDiff) && child.fallback || getFlag(child, IsScheduling))) {
      if (getFlag(child, IsScheduling) && child.ctx.schedule) {
        (schedulePromises1 = schedulePromises1 || []).push(child.ctx.schedule.promise);
        isSchedulingFallback = true;
      }
      if (!getFlag(child, DidDiff) && getFlag(child, DidCommit)) {
        for (const node of getChildValues(child)) {
          adapter.remove({
            node,
            parentNode: host.value,
            isNested: false,
            root
          });
        }
      }
      child = child.fallback;
      if (schedulePromises1 && isSchedulingFallback && child) {
        if (!getFlag(child, DidDiff)) {
          const inflightDiff = getInflightDiff(child);
          schedulePromises1.push(inflightDiff);
        } else {
          schedulePromises1 = void 0;
        }
        if (getFlag(child, IsSchedulingFallback)) {
          isSchedulingFallback = true;
        } else {
          setFlag(child, IsSchedulingFallback, true);
          isSchedulingFallback = false;
        }
      }
    }
    if (schedulePromises1 && schedulePromises1.length > 1) {
      schedulePromises.push(safeRace(schedulePromises1));
    }
    if (child) {
      const value = commit(adapter, host, child, ctx, scope, root, index, schedulePromises, hydrationNodes);
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          values.push(value[j]);
        }
        index += value.length;
      } else if (value) {
        values.push(value);
        index++;
      }
    }
  }
  if (parent.graveyard) {
    for (let i = 0; i < parent.graveyard.length; i++) {
      const child = parent.graveyard[i];
      unmount(adapter, host, ctx, root, child, false);
    }
    parent.graveyard = void 0;
  }
  if (parent.lingerers) {
    values = getChildValues(parent);
  }
  return values;
}
function commitText(adapter, ret, el, scope, hydrationNodes, root) {
  const value = adapter.text({
    value: el.props.value,
    scope,
    oldNode: ret.value,
    hydrationNodes,
    root
  });
  ret.value = value;
  return value;
}
function commitRaw(adapter, host, ret, scope, hydrationNodes, root) {
  if (!ret.oldProps || ret.oldProps.value !== ret.el.props.value) {
    const oldNodes = wrap(ret.value);
    for (let i = 0; i < oldNodes.length; i++) {
      const oldNode = oldNodes[i];
      adapter.remove({
        node: oldNode,
        parentNode: host.value,
        isNested: false,
        root
      });
    }
    ret.value = adapter.raw({
      value: ret.el.props.value,
      scope,
      hydrationNodes,
      root
    });
  }
  ret.oldProps = stripSpecialProps(ret.el.props);
  return ret.value;
}
function commitHost(adapter, ret, ctx, root, schedulePromises, hydrationNodes) {
  if (getFlag(ret, IsCopied) && getFlag(ret, DidCommit)) {
    return getValue(ret);
  }
  const tag = ret.el.tag;
  const props = stripSpecialProps(ret.el.props);
  const oldProps = ret.oldProps;
  let node = ret.value;
  let copyProps;
  let copyChildren = false;
  if (oldProps) {
    for (const propName in props) {
      if (props[propName] === Copy) {
        props[propName] = oldProps[propName];
        (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
      }
    }
    if (typeof ret.el.props.copy === "string") {
      const copyMetaProp = new MetaProp("copy", ret.el.props.copy);
      if (copyMetaProp.include) {
        for (const propName of copyMetaProp.props) {
          if (propName in oldProps) {
            props[propName] = oldProps[propName];
            (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
          }
        }
      } else {
        for (const propName in oldProps) {
          if (!copyMetaProp.props.has(propName)) {
            props[propName] = oldProps[propName];
            (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
          }
        }
      }
      copyChildren = copyMetaProp.includes("children");
    }
  }
  const scope = ret.scope;
  let childHydrationNodes;
  let quietProps;
  let hydrationMetaProp;
  if (!getFlag(ret, DidCommit)) {
    if (tag === Portal) {
      if (ret.el.props.hydrate && typeof ret.el.props.hydrate !== "string") {
        childHydrationNodes = adapter.adopt({
          tag,
          tagName: getTagName(tag),
          node,
          props,
          scope,
          root
        });
        if (childHydrationNodes) {
          for (let i = 0; i < childHydrationNodes.length; i++) {
            adapter.remove({
              node: childHydrationNodes[i],
              parentNode: node,
              isNested: false,
              root
            });
          }
        }
      }
    } else {
      if (!node && hydrationNodes) {
        const nextChild = hydrationNodes.shift();
        if (typeof ret.el.props.hydrate === "string") {
          hydrationMetaProp = new MetaProp("hydration", ret.el.props.hydrate);
          if (hydrationMetaProp.include) {
            quietProps = new Set(Object.keys(props));
            for (const propName of hydrationMetaProp.props) {
              quietProps.delete(propName);
            }
          } else {
            quietProps = hydrationMetaProp.props;
          }
        }
        childHydrationNodes = adapter.adopt({
          tag,
          tagName: getTagName(tag),
          node: nextChild,
          props,
          scope,
          root
        });
        if (childHydrationNodes) {
          node = nextChild;
          for (let i = 0; i < childHydrationNodes.length; i++) {
            adapter.remove({
              node: childHydrationNodes[i],
              parentNode: node,
              isNested: false,
              root
            });
          }
        }
      }
      if (!node) {
        node = adapter.create({
          tag,
          tagName: getTagName(tag),
          props,
          scope,
          root
        });
      }
      ret.value = node;
    }
  }
  if (tag !== Portal) {
    adapter.patch({
      tag,
      tagName: getTagName(tag),
      node,
      props,
      oldProps,
      scope,
      root,
      copyProps,
      isHydrating: !!childHydrationNodes,
      quietProps
    });
  }
  if (!copyChildren) {
    const children = commitChildren(adapter, ret, ctx, scope, tag === Portal ? node : root, ret, 0, schedulePromises, hydrationMetaProp && !hydrationMetaProp.includes("children") ? void 0 : childHydrationNodes);
    adapter.arrange({
      tag,
      tagName: getTagName(tag),
      node,
      props,
      children,
      oldProps,
      scope,
      root
    });
  }
  ret.oldProps = props;
  if (tag === Portal) {
    flush(adapter, ret.value);
    return;
  }
  return node;
}
var MetaProp = class {
  constructor(propName, propValue) {
    this.include = true;
    this.props = /* @__PURE__ */ new Set();
    let noBangs = true;
    let allBangs = true;
    const tokens = propValue.split(/[,\s]+/);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) {
        continue;
      } else if (token.startsWith("!")) {
        noBangs = false;
        this.props.add(token.slice(1));
      } else {
        allBangs = false;
        this.props.add(token);
      }
    }
    if (!allBangs && !noBangs) {
      console.error(`Invalid ${propName} prop "${propValue}".
Use prop or !prop but not both.`);
      this.include = true;
      this.props.clear();
    } else {
      this.include = noBangs;
    }
  }
  includes(propName) {
    if (this.include) {
      return this.props.has(propName);
    } else {
      return !this.props.has(propName);
    }
  }
};
function contextContains(parent, child) {
  for (let current = child; current !== void 0; current = current.parent) {
    if (current === parent) {
      return true;
    }
  }
  return false;
}
var ANONYMOUS_ROOT = {};
function flush(adapter, root, initiator) {
  if (root != null) {
    adapter.finalize(root);
  }
  if (typeof root !== "object" || root === null) {
    root = ANONYMOUS_ROOT;
  }
  const afterMap = afterMapByRoot.get(root);
  if (afterMap) {
    const afterMap1 = /* @__PURE__ */ new Map();
    for (const [ctx, callbacks] of afterMap) {
      if (getFlag(ctx.ret, IsScheduling) || initiator && !contextContains(initiator, ctx)) {
        afterMap.delete(ctx);
        afterMap1.set(ctx, callbacks);
      }
    }
    if (afterMap1.size) {
      afterMapByRoot.set(root, afterMap1);
    } else {
      afterMapByRoot.delete(root);
    }
    for (const [ctx, callbacks] of afterMap) {
      const value = adapter.read(getValue(ctx.ret));
      for (const callback of callbacks) {
        callback(value);
      }
    }
  }
}
function unmount(adapter, host, ctx, root, ret, isNested) {
  if (ret.fallback) {
    unmount(adapter, host, ctx, root, ret.fallback, isNested);
    ret.fallback = void 0;
  }
  if (getFlag(ret, IsResurrecting)) {
    return;
  }
  if (ret.lingerers) {
    for (let i = 0; i < ret.lingerers.length; i++) {
      const lingerers = ret.lingerers[i];
      if (lingerers) {
        for (const lingerer of lingerers) {
          unmount(adapter, host, ctx, root, lingerer, isNested);
        }
      }
    }
    ret.lingerers = void 0;
  }
  if (typeof ret.el.tag === "function") {
    unmountComponent(ret.ctx, isNested);
  } else if (ret.el.tag === Fragment) {
    unmountChildren(adapter, host, ctx, root, ret, isNested);
  } else if (ret.el.tag === Portal) {
    unmountChildren(adapter, ret, ctx, ret.value, ret, false);
    if (ret.value != null) {
      adapter.finalize(ret.value);
    }
  } else {
    unmountChildren(adapter, ret, ctx, root, ret, true);
    if (getFlag(ret, DidCommit)) {
      if (ctx) {
        removeEventTargetDelegates(ctx.ctx, [ret.value], (ctx1) => ctx1[_ContextState].host === host);
      }
      adapter.remove({
        node: ret.value,
        parentNode: host.value,
        isNested,
        root
      });
    }
  }
}
function unmountChildren(adapter, host, ctx, root, ret, isNested) {
  if (ret.graveyard) {
    for (let i = 0; i < ret.graveyard.length; i++) {
      const child = ret.graveyard[i];
      unmount(adapter, host, ctx, root, child, isNested);
    }
    ret.graveyard = void 0;
  }
  const rawChildren = ret.children;
  if (Array.isArray(rawChildren)) {
    for (let i = 0; i < rawChildren.length; i++) {
      const child = rawChildren[i];
      if (typeof child === "object") {
        unmount(adapter, host, ctx, root, child, isNested);
      }
    }
  } else if (rawChildren !== void 0) {
    unmount(adapter, host, ctx, root, rawChildren, isNested);
  }
}
var provisionMaps = /* @__PURE__ */ new WeakMap();
var scheduleMap = /* @__PURE__ */ new WeakMap();
var cleanupMap = /* @__PURE__ */ new WeakMap();
var afterMapByRoot = /* @__PURE__ */ new WeakMap();
var ContextState = class {
  constructor(adapter, root, host, parent, scope, ret) {
    this.adapter = adapter;
    this.root = root;
    this.host = host;
    this.parent = parent;
    this.ctx = new Context(this);
    this.scope = scope;
    this.ret = ret;
    this.iterator = void 0;
    this.inflight = void 0;
    this.enqueued = void 0;
    this.onPropsProvided = void 0;
    this.onPropsRequested = void 0;
    this.pull = void 0;
    this.index = 0;
    this.schedule = void 0;
  }
};
var _ContextState = /* @__PURE__ */ Symbol.for("crank.ContextState");
var Context = class extends CustomEventTarget {
  // TODO: If we could make the constructor function take a nicer value, it
  // would be useful for testing purposes.
  constructor(state) {
    super(state.parent ? state.parent.ctx : null);
    this[_ContextState] = state;
  }
  /**
   * The current props of the associated element.
   */
  get props() {
    return this[_ContextState].ret.el.props;
  }
  /**
   * The current value of the associated element.
   *
   * @deprecated
   */
  get value() {
    console.warn("Context.value is deprecated.");
    return this[_ContextState].adapter.read(getValue(this[_ContextState].ret));
  }
  get isExecuting() {
    return getFlag(this[_ContextState].ret, IsExecuting);
  }
  get isUnmounted() {
    return getFlag(this[_ContextState].ret, IsUnmounted);
  }
  *[Symbol.iterator]() {
    const ctx = this[_ContextState];
    setFlag(ctx.ret, IsInForOfLoop);
    try {
      while (!getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsErrored)) {
        if (getFlag(ctx.ret, NeedsToYield)) {
          throw new Error(`<${getTagName(ctx.ret.el.tag)}> context iterated twice without a yield`);
        } else {
          setFlag(ctx.ret, NeedsToYield);
        }
        yield ctx.ret.el.props;
      }
    } finally {
      setFlag(ctx.ret, IsInForOfLoop, false);
    }
  }
  async *[Symbol.asyncIterator]() {
    const ctx = this[_ContextState];
    setFlag(ctx.ret, IsInForAwaitOfLoop);
    try {
      while (!getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsErrored)) {
        if (getFlag(ctx.ret, NeedsToYield)) {
          throw new Error(`<${getTagName(ctx.ret.el.tag)}> context iterated twice without a yield`);
        } else {
          setFlag(ctx.ret, NeedsToYield);
        }
        if (getFlag(ctx.ret, PropsAvailable)) {
          setFlag(ctx.ret, PropsAvailable, false);
          yield ctx.ret.el.props;
        } else {
          const props = await new Promise((resolve) => ctx.onPropsProvided = resolve);
          if (getFlag(ctx.ret, IsUnmounted) || getFlag(ctx.ret, IsErrored)) {
            break;
          }
          yield props;
        }
        if (ctx.onPropsRequested) {
          ctx.onPropsRequested();
          ctx.onPropsRequested = void 0;
        }
      }
    } finally {
      setFlag(ctx.ret, IsInForAwaitOfLoop, false);
      if (ctx.onPropsRequested) {
        ctx.onPropsRequested();
        ctx.onPropsRequested = void 0;
      }
    }
  }
  /**
   * Re-executes a component.
   *
   * @param callback - Optional callback to execute before refresh
   * @returns The rendered result of the component or a promise thereof if the
   * component or its children execute asynchronously.
   */
  refresh(callback) {
    const ctx = this[_ContextState];
    if (getFlag(ctx.ret, IsUnmounted)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is unmounted. Check the isUnmounted property if necessary.`);
      return ctx.adapter.read(getValue(ctx.ret));
    } else if (getFlag(ctx.ret, IsExecuting)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is already executing Check the isExecuting property if necessary.`);
      return ctx.adapter.read(getValue(ctx.ret));
    }
    if (callback) {
      const result = callback();
      if (isPromiseLike(result)) {
        return Promise.resolve(result).then(() => {
          if (!getFlag(ctx.ret, IsUnmounted)) {
            return this.refresh();
          }
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
    }
    if (getFlag(ctx.ret, IsScheduling)) {
      setFlag(ctx.ret, IsSchedulingRefresh);
    }
    const commitLabel = "commit (" + getTagName(ctx.ret.el.tag) + ")";
    let diff2;
    const schedulePromises = [];
    try {
      setFlag(ctx.ret, IsRefreshing);
      diff2 = enqueueComponent(ctx);
      if (isPromiseLike(diff2)) {
        return diff2.then(() => {
          markStart(commitLabel);
          const value = commitComponent(ctx, schedulePromises);
          measureMark(commitLabel);
          return ctx.adapter.read(value);
        }).then((result2) => {
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          return result2;
        }).catch((err) => {
          const diff3 = propagateError(ctx, err, schedulePromises);
          if (diff3) {
            return diff3.then(() => {
              if (schedulePromises.length) {
                return Promise.all(schedulePromises).then(() => {
                  return ctx.adapter.read(getValue(ctx.ret));
                });
              }
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          return ctx.adapter.read(getValue(ctx.ret));
        }).finally(() => setFlag(ctx.ret, IsRefreshing, false));
      }
      markStart(commitLabel);
      const result = ctx.adapter.read(commitComponent(ctx, schedulePromises));
      measureMark(commitLabel);
      if (schedulePromises.length) {
        return Promise.all(schedulePromises).then(() => {
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
      return result;
    } catch (err) {
      const diff3 = propagateError(ctx, err, schedulePromises);
      if (diff3) {
        return diff3.then(() => {
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
        }).then(() => ctx.adapter.read(getValue(ctx.ret)));
      }
      if (schedulePromises.length) {
        return Promise.all(schedulePromises).then(() => {
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
      return ctx.adapter.read(getValue(ctx.ret));
    } finally {
      if (!isPromiseLike(diff2)) {
        setFlag(ctx.ret, IsRefreshing, false);
      }
    }
  }
  schedule(callback) {
    if (!callback) {
      return new Promise((resolve) => this.schedule(resolve));
    }
    const ctx = this[_ContextState];
    let callbacks = scheduleMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      scheduleMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  after(callback) {
    if (!callback) {
      return new Promise((resolve) => this.after(resolve));
    }
    const ctx = this[_ContextState];
    const root = ctx.root || ANONYMOUS_ROOT;
    let afterMap = afterMapByRoot.get(root);
    if (!afterMap) {
      afterMap = /* @__PURE__ */ new Map();
      afterMapByRoot.set(root, afterMap);
    }
    let callbacks = afterMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      afterMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  flush(callback) {
    console.error("Context.flush() method has been renamed to after()");
    this.after(callback);
  }
  cleanup(callback) {
    if (!callback) {
      return new Promise((resolve) => this.cleanup(resolve));
    }
    const ctx = this[_ContextState];
    if (getFlag(ctx.ret, IsUnmounted)) {
      const value = ctx.adapter.read(getValue(ctx.ret));
      callback(value);
      return;
    }
    let callbacks = cleanupMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      cleanupMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  consume(key) {
    for (let ctx = this[_ContextState].parent; ctx !== void 0; ctx = ctx.parent) {
      const provisions = provisionMaps.get(ctx);
      if (provisions && provisions.has(key)) {
        return provisions.get(key);
      }
    }
  }
  provide(key, value) {
    const ctx = this[_ContextState];
    let provisions = provisionMaps.get(ctx);
    if (!provisions) {
      provisions = /* @__PURE__ */ new Map();
      provisionMaps.set(ctx, provisions);
    }
    provisions.set(key, value);
  }
  [CustomEventTarget.dispatchEventOnSelf](ev) {
    const ctx = this[_ContextState];
    let propCallback = ctx.ret.el.props["on" + ev.type];
    if (typeof propCallback === "function") {
      propCallback(ev);
    } else {
      for (const propName in ctx.ret.el.props) {
        if (propName.toLowerCase() === "on" + ev.type.toLowerCase()) {
          propCallback = ctx.ret.el.props[propName];
          if (typeof propCallback === "function") {
            propCallback(ev);
          }
        }
      }
    }
  }
};
function diffComponent(adapter, root, host, parent, scope, ret) {
  let ctx;
  if (ret.ctx) {
    ctx = ret.ctx;
    if (getFlag(ctx.ret, IsExecuting)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is already executing`);
      return;
    } else if (ctx.schedule) {
      return ctx.schedule.promise.then(() => {
        return diffComponent(adapter, root, host, parent, scope, ret);
      });
    }
  } else {
    ctx = ret.ctx = new ContextState(adapter, root, host, parent, scope, ret);
  }
  setFlag(ctx.ret, IsUpdating);
  return enqueueComponent(ctx);
}
function diffComponentChildren(ctx, children, isYield) {
  if (getFlag(ctx.ret, IsUnmounted) || getFlag(ctx.ret, IsErrored)) {
    return;
  } else if (children === void 0) {
    console.error(`Component <${getTagName(ctx.ret.el.tag)}> has ${isYield ? "yielded" : "returned"} undefined. If this was intentional, ${isYield ? "yield" : "return"} null instead.`);
  }
  let diff2;
  try {
    setFlag(ctx.ret, IsExecuting);
    diff2 = diffChildren(ctx.adapter, ctx.root, ctx.host, ctx, ctx.scope, ctx.ret, narrow(children));
    if (diff2) {
      diff2 = diff2.catch((err) => handleChildError(ctx, err));
    }
  } catch (err) {
    diff2 = handleChildError(ctx, err);
  } finally {
    setFlag(ctx.ret, IsExecuting, false);
  }
  return diff2;
}
function enqueueComponent(ctx) {
  if (!ctx.inflight) {
    const [block, diff2] = runComponent(ctx);
    if (block) {
      ctx.inflight = [block.finally(() => advanceComponent(ctx)), diff2];
    }
    return diff2;
  } else if (!ctx.enqueued) {
    let resolve;
    ctx.enqueued = [
      new Promise((resolve1) => resolve = resolve1).finally(() => advanceComponent(ctx)),
      ctx.inflight[0].finally(() => {
        const [block, diff2] = runComponent(ctx);
        resolve(block);
        return diff2;
      })
    ];
  }
  return ctx.enqueued[1];
}
function advanceComponent(ctx) {
  ctx.inflight = ctx.enqueued;
  ctx.enqueued = void 0;
}
function runComponent(ctx) {
  if (getFlag(ctx.ret, IsUnmounted)) {
    return [void 0, void 0];
  }
  const ret = ctx.ret;
  const initial = !ctx.iterator;
  const tagName = getTagName(ret.el.tag);
  if (initial) {
    setFlag(ctx.ret, IsExecuting);
    clearEventListeners(ctx.ctx);
    let returned;
    try {
      markStart(tagName);
      returned = ret.el.tag.call(ctx.ctx, ret.el.props, ctx.ctx);
    } catch (err) {
      setFlag(ctx.ret, IsErrored);
      throw err;
    } finally {
      setFlag(ctx.ret, IsExecuting, false);
    }
    if (isIteratorLike(returned)) {
      ctx.iterator = returned;
    } else if (!isPromiseLike(returned)) {
      measureMark(tagName);
      return [
        void 0,
        diffComponentChildren(ctx, returned, false)
      ];
    } else {
      const returned1 = returned instanceof Promise ? returned : Promise.resolve(returned);
      returned1.then(() => measureMark(tagName), () => measureMark(tagName));
      return [
        returned1.catch(NOOP),
        returned1.then((returned2) => diffComponentChildren(ctx, returned2, false), (err) => {
          setFlag(ctx.ret, IsErrored);
          throw err;
        })
      ];
    }
  }
  let iteration;
  if (initial) {
    try {
      setFlag(ctx.ret, IsExecuting);
      markStart(tagName);
      iteration = ctx.iterator.next();
    } catch (err) {
      setFlag(ctx.ret, IsErrored);
      throw err;
    } finally {
      setFlag(ctx.ret, IsExecuting, false);
    }
    if (isPromiseLike(iteration)) {
      setFlag(ctx.ret, IsAsyncGen);
    } else {
      setFlag(ctx.ret, IsSyncGen);
    }
  }
  if (getFlag(ctx.ret, IsSyncGen)) {
    if (!initial) {
      try {
        setFlag(ctx.ret, IsExecuting);
        const oldResult = ctx.adapter.read(getValue(ctx.ret));
        markStart(tagName);
        iteration = ctx.iterator.next(oldResult);
        measureMark(tagName);
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    } else {
      measureMark(tagName);
    }
    if (isPromiseLike(iteration)) {
      throw new Error("Mixed generator component");
    }
    if (getFlag(ctx.ret, IsInForOfLoop) && !getFlag(ctx.ret, NeedsToYield) && !getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsSchedulingRefresh)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> yielded/returned more than once in for...of loop`);
    }
    setFlag(ctx.ret, NeedsToYield, false);
    setFlag(ctx.ret, IsSchedulingRefresh, false);
    if (iteration.done) {
      setFlag(ctx.ret, IsSyncGen, false);
      ctx.iterator = void 0;
    }
    const diff2 = diffComponentChildren(ctx, iteration.value, !iteration.done);
    const block = isPromiseLike(diff2) ? diff2.catch(NOOP) : void 0;
    return [block, diff2];
  } else {
    if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
      measureMark(tagName);
      pullComponent(ctx, iteration);
      const block = resumePropsAsyncIterator(ctx);
      return [block, ctx.pull && ctx.pull.diff];
    } else {
      resumePropsAsyncIterator(ctx);
      if (!initial) {
        try {
          setFlag(ctx.ret, IsExecuting);
          const oldResult = ctx.adapter.read(getValue(ctx.ret));
          markStart(tagName);
          iteration = ctx.iterator.next(oldResult);
        } catch (err) {
          setFlag(ctx.ret, IsErrored);
          throw err;
        } finally {
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
      if (!isPromiseLike(iteration)) {
        throw new Error("Mixed generator component");
      }
      iteration.then(() => measureMark(tagName), () => measureMark(tagName));
      const diff2 = iteration.then((iteration2) => {
        if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          pullComponent(ctx, iteration2);
        } else {
          if (getFlag(ctx.ret, IsInForOfLoop) && !getFlag(ctx.ret, NeedsToYield) && !getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsSchedulingRefresh)) {
            console.error(`Component <${getTagName(ctx.ret.el.tag)}> yielded/returned more than once in for...of loop`);
          }
        }
        setFlag(ctx.ret, NeedsToYield, false);
        setFlag(ctx.ret, IsSchedulingRefresh, false);
        if (iteration2.done) {
          setFlag(ctx.ret, IsAsyncGen, false);
          ctx.iterator = void 0;
        }
        return diffComponentChildren(
          ctx,
          // Children can be void so we eliminate that here
          iteration2.value,
          !iteration2.done
        );
      }, (err) => {
        setFlag(ctx.ret, IsErrored);
        throw err;
      });
      return [diff2.catch(NOOP), diff2];
    }
  }
}
function resumePropsAsyncIterator(ctx) {
  if (ctx.onPropsProvided) {
    ctx.onPropsProvided(ctx.ret.el.props);
    ctx.onPropsProvided = void 0;
    setFlag(ctx.ret, PropsAvailable, false);
  } else {
    setFlag(ctx.ret, PropsAvailable);
    if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
      return new Promise((resolve) => ctx.onPropsRequested = resolve);
    }
  }
  return ctx.pull && ctx.pull.iterationP && ctx.pull.iterationP.then(NOOP, NOOP);
}
async function pullComponent(ctx, iterationP) {
  if (!iterationP || ctx.pull) {
    return;
  }
  ctx.pull = { iterationP: void 0, diff: void 0, onChildError: void 0 };
  let done = false;
  try {
    let childError;
    while (!done) {
      if (isPromiseLike(iterationP)) {
        ctx.pull.iterationP = iterationP;
      }
      let onDiff;
      ctx.pull.diff = new Promise((resolve) => onDiff = resolve).then(() => {
        if (!(getFlag(ctx.ret, IsUpdating) || getFlag(ctx.ret, IsRefreshing))) {
          commitComponent(ctx, []);
        }
      }, (err) => {
        if (!(getFlag(ctx.ret, IsUpdating) || getFlag(ctx.ret, IsRefreshing)) || // TODO: is this flag necessary?
        !getFlag(ctx.ret, NeedsToYield)) {
          return propagateError(ctx, err, []);
        }
        throw err;
      });
      let iteration;
      try {
        iteration = await iterationP;
      } catch (err) {
        done = true;
        setFlag(ctx.ret, IsErrored);
        setFlag(ctx.ret, NeedsToYield, false);
        onDiff(Promise.reject(err));
        break;
      }
      let oldResult;
      {
        let floating = true;
        const oldResult1 = new Promise((resolve, reject) => {
          ctx.ctx.schedule(resolve);
          ctx.pull.onChildError = (err) => {
            reject(err);
            if (floating) {
              childError = err;
              resumePropsAsyncIterator(ctx);
              return ctx.pull.diff;
            }
          };
        });
        oldResult1.catch(NOOP);
        oldResult = Object.create(oldResult1);
        oldResult.then = function(onfulfilled, onrejected) {
          floating = false;
          return oldResult1.then(onfulfilled, onrejected);
        };
        oldResult.catch = function(onrejected) {
          floating = false;
          return oldResult1.catch(onrejected);
        };
      }
      if (childError != null) {
        try {
          setFlag(ctx.ret, IsExecuting);
          if (typeof ctx.iterator.throw !== "function") {
            throw childError;
          }
          iteration = await ctx.iterator.throw(childError);
        } catch (err) {
          done = true;
          setFlag(ctx.ret, IsErrored);
          setFlag(ctx.ret, NeedsToYield, false);
          onDiff(Promise.reject(err));
          break;
        } finally {
          childError = void 0;
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
      if (!getFlag(ctx.ret, IsInForAwaitOfLoop)) {
        setFlag(ctx.ret, PropsAvailable, false);
      }
      done = !!iteration.done;
      let diff2;
      try {
        if (!isPromiseLike(iterationP)) {
          diff2 = void 0;
        } else if (!getFlag(ctx.ret, NeedsToYield) && getFlag(ctx.ret, PropsAvailable) && getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          diff2 = void 0;
        } else {
          diff2 = diffComponentChildren(ctx, iteration.value, !iteration.done);
        }
      } catch (err) {
        onDiff(Promise.reject(err));
      } finally {
        onDiff(diff2);
        setFlag(ctx.ret, NeedsToYield, false);
      }
      if (getFlag(ctx.ret, IsUnmounted)) {
        while ((!iteration || !iteration.done) && ctx.iterator && getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          try {
            setFlag(ctx.ret, IsExecuting);
            iteration = await ctx.iterator.next(oldResult);
          } catch (err) {
            setFlag(ctx.ret, IsErrored);
            throw err;
          } finally {
            setFlag(ctx.ret, IsExecuting, false);
          }
        }
        if ((!iteration || !iteration.done) && ctx.iterator && typeof ctx.iterator.return === "function") {
          try {
            setFlag(ctx.ret, IsExecuting);
            await ctx.iterator.return();
          } catch (err) {
            setFlag(ctx.ret, IsErrored);
            throw err;
          } finally {
            setFlag(ctx.ret, IsExecuting, false);
          }
        }
        break;
      } else if (!getFlag(ctx.ret, IsInForAwaitOfLoop)) {
        break;
      } else if (!iteration.done) {
        try {
          setFlag(ctx.ret, IsExecuting);
          iterationP = ctx.iterator.next(oldResult);
        } finally {
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
    }
  } finally {
    if (done) {
      setFlag(ctx.ret, IsAsyncGen, false);
      ctx.iterator = void 0;
    }
    ctx.pull = void 0;
  }
}
function commitComponent(ctx, schedulePromises, hydrationNodes) {
  if (ctx.schedule) {
    ctx.schedule.promise.then(() => {
      commitComponent(ctx, []);
      propagateComponent(ctx);
    });
    return getValue(ctx.ret);
  }
  const values = commitChildren(ctx.adapter, ctx.host, ctx, ctx.scope, ctx.root, ctx.ret, ctx.index, schedulePromises, hydrationNodes);
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  addEventTargetDelegates(ctx.ctx, values);
  const wasScheduling = getFlag(ctx.ret, IsScheduling);
  let schedulePromises1;
  const callbacks = scheduleMap.get(ctx);
  if (callbacks) {
    scheduleMap.delete(ctx);
    setFlag(ctx.ret, IsScheduling);
    const result = ctx.adapter.read(unwrap(values));
    for (const callback of callbacks) {
      const scheduleResult = callback(result);
      if (isPromiseLike(scheduleResult)) {
        (schedulePromises1 = schedulePromises1 || []).push(scheduleResult);
      }
    }
    if (schedulePromises1 && !getFlag(ctx.ret, DidCommit)) {
      const scheduleCallbacksP = Promise.all(schedulePromises1).then(() => {
        setFlag(ctx.ret, IsScheduling, wasScheduling);
        propagateComponent(ctx);
        if (ctx.ret.fallback) {
          unmount(ctx.adapter, ctx.host, ctx.parent, ctx.root, ctx.ret.fallback, false);
        }
        ctx.ret.fallback = void 0;
      });
      let onAbort;
      const scheduleP = safeRace([
        scheduleCallbacksP,
        new Promise((resolve) => onAbort = resolve)
      ]).finally(() => {
        ctx.schedule = void 0;
      });
      ctx.schedule = { promise: scheduleP, onAbort };
      schedulePromises.push(scheduleP);
    } else {
      setFlag(ctx.ret, IsScheduling, wasScheduling);
    }
  } else {
    setFlag(ctx.ret, IsScheduling, wasScheduling);
  }
  if (!getFlag(ctx.ret, IsScheduling)) {
    if (!getFlag(ctx.ret, IsUpdating)) {
      propagateComponent(ctx);
    }
    if (ctx.ret.fallback) {
      unmount(ctx.adapter, ctx.host, ctx.parent, ctx.root, ctx.ret.fallback, false);
    }
    ctx.ret.fallback = void 0;
    setFlag(ctx.ret, IsUpdating, false);
  }
  setFlag(ctx.ret, DidCommit);
  return getValue(ctx.ret, true);
}
function isRetainerActive(target, host) {
  const stack = [host];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === target) {
      return true;
    }
    const isHostBoundary = current !== host && (typeof current.el.tag === "string" && current.el.tag !== Fragment || current.el.tag === Portal);
    if (current.children && !isHostBoundary) {
      if (Array.isArray(current.children)) {
        for (const child of current.children) {
          if (child) {
            stack.push(child);
          }
        }
      } else {
        stack.push(current.children);
      }
    }
    if (current.fallback && !getFlag(current, DidDiff)) {
      stack.push(current.fallback);
    }
  }
  return false;
}
function propagateComponent(ctx) {
  const values = getChildValues(ctx.ret, ctx.index);
  addEventTargetDelegates(ctx.ctx, values, (ctx1) => ctx1[_ContextState].host === ctx.host);
  const host = ctx.host;
  const initiator = ctx.ret;
  if (!isRetainerActive(initiator, host)) {
    return;
  }
  if (!getFlag(host, DidCommit)) {
    return;
  }
  const props = stripSpecialProps(host.el.props);
  const hostChildren = getChildValues(host, 0);
  ctx.adapter.arrange({
    tag: host.el.tag,
    tagName: getTagName(host.el.tag),
    node: host.value,
    props,
    oldProps: props,
    children: hostChildren,
    scope: host.scope,
    root: ctx.root
  });
  flush(ctx.adapter, ctx.root, ctx);
}
async function unmountComponent(ctx, isNested) {
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  let cleanupPromises;
  const callbacks = cleanupMap.get(ctx);
  if (callbacks) {
    const oldResult = ctx.adapter.read(getValue(ctx.ret));
    cleanupMap.delete(ctx);
    for (const callback of callbacks) {
      const cleanup = callback(oldResult);
      if (isPromiseLike(cleanup)) {
        (cleanupPromises = cleanupPromises || []).push(cleanup);
      }
    }
  }
  let didLinger = false;
  if (!isNested && cleanupPromises) {
    didLinger = true;
    const index = ctx.index;
    const lingerers = ctx.host.lingerers || (ctx.host.lingerers = []);
    let set = lingerers[index];
    if (set == null) {
      set = /* @__PURE__ */ new Set();
      lingerers[index] = set;
    }
    set.add(ctx.ret);
    await Promise.all(cleanupPromises);
    set.delete(ctx.ret);
    if (set.size === 0) {
      lingerers[index] = void 0;
    }
    if (!lingerers.some(Boolean)) {
      ctx.host.lingerers = void 0;
    }
  }
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  setFlag(ctx.ret, IsUnmounted);
  if (ctx.schedule) {
    ctx.schedule.onAbort();
    ctx.schedule = void 0;
  }
  clearEventListeners(ctx.ctx);
  unmountChildren(ctx.adapter, ctx.host, ctx, ctx.root, ctx.ret, isNested);
  if (didLinger) {
    if (ctx.root != null) {
      ctx.adapter.finalize(ctx.root);
    }
  }
  if (ctx.iterator) {
    if (ctx.pull) {
      resumePropsAsyncIterator(ctx);
      return;
    }
    if (ctx.inflight) {
      await ctx.inflight[1];
    }
    let iteration;
    if (getFlag(ctx.ret, IsInForOfLoop)) {
      try {
        setFlag(ctx.ret, IsExecuting);
        const oldResult = ctx.adapter.read(getValue(ctx.ret));
        const iterationP = ctx.iterator.next(oldResult);
        if (isPromiseLike(iterationP)) {
          if (!getFlag(ctx.ret, IsAsyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = await iterationP;
        } else {
          if (!getFlag(ctx.ret, IsSyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = iterationP;
        }
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    }
    if ((!iteration || !iteration.done) && ctx.iterator && typeof ctx.iterator.return === "function") {
      try {
        setFlag(ctx.ret, IsExecuting);
        const iterationP = ctx.iterator.return();
        if (isPromiseLike(iterationP)) {
          if (!getFlag(ctx.ret, IsAsyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = await iterationP;
        } else {
          if (!getFlag(ctx.ret, IsSyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = iterationP;
        }
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    }
  }
}
function handleChildError(ctx, err) {
  if (!ctx.iterator) {
    throw err;
  }
  if (ctx.pull) {
    ctx.pull.onChildError(err);
    return ctx.pull.diff;
  }
  if (!ctx.iterator.throw) {
    throw err;
  }
  resumePropsAsyncIterator(ctx);
  let iteration;
  try {
    setFlag(ctx.ret, IsExecuting);
    iteration = ctx.iterator.throw(err);
  } catch (err2) {
    setFlag(ctx.ret, IsErrored);
    throw err2;
  } finally {
    setFlag(ctx.ret, IsExecuting, false);
  }
  if (isPromiseLike(iteration)) {
    return iteration.then((iteration2) => {
      if (iteration2.done) {
        setFlag(ctx.ret, IsSyncGen, false);
        setFlag(ctx.ret, IsAsyncGen, false);
        ctx.iterator = void 0;
      }
      return diffComponentChildren(ctx, iteration2.value, !iteration2.done);
    }, (err2) => {
      setFlag(ctx.ret, IsErrored);
      throw err2;
    });
  }
  if (iteration.done) {
    setFlag(ctx.ret, IsSyncGen, false);
    setFlag(ctx.ret, IsAsyncGen, false);
    ctx.iterator = void 0;
  }
  return diffComponentChildren(ctx, iteration.value, !iteration.done);
}
function propagateError(ctx, err, schedulePromises) {
  const parent = ctx.parent;
  if (!parent) {
    throw err;
  }
  let diff2;
  try {
    diff2 = handleChildError(parent, err);
  } catch (err2) {
    return propagateError(parent, err2, schedulePromises);
  }
  if (isPromiseLike(diff2)) {
    return diff2.then(() => void commitComponent(parent, schedulePromises), (err2) => propagateError(parent, err2, schedulePromises));
  }
  commitComponent(parent, schedulePromises);
}

// ../packages/crankeditable/node_modules/@b9g/revise/src/edit.js
function measure(subseq) {
  let length = 0, includedLength = 0, excludedLength = 0;
  for (let i = 0; i < subseq.length; i++) {
    const s = subseq[i];
    length += s;
    if (i % 2 === 0) {
      excludedLength += s;
    } else {
      includedLength += s;
    }
  }
  return { length, includedLength, excludedLength };
}
function pushSegment(subseq, length, included) {
  if (length < 0) {
    throw new RangeError("Negative length");
  } else if (length === 0) {
    return;
  } else if (!subseq.length) {
    if (included) {
      subseq.push(0, length);
    } else {
      subseq.push(length);
    }
  } else {
    const included1 = subseq.length % 2 === 0;
    if (included === included1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
}
function align(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).length) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (let i1 = 0, i2 = 0, length1 = 0, length2 = 0, included1 = true, included2 = true; i1 < subseq1.length || i2 < subseq2.length; ) {
    if (length1 === 0) {
      if (i1 >= subseq1.length) {
        throw new Error("Length mismatch");
      }
      length1 = subseq1[i1++];
      included1 = !included1;
    }
    if (length2 === 0) {
      if (i2 >= subseq2.length) {
        throw new Error("Size mismatch");
      }
      length2 = subseq2[i2++];
      included2 = !included2;
    }
    if (length1 < length2) {
      if (length1) {
        result.push([length1, included1, included2]);
      }
      length2 = length2 - length1;
      length1 = 0;
    } else if (length1 > length2) {
      if (length2) {
        result.push([length2, included1, included2]);
      }
      length1 = length1 - length2;
      length2 = 0;
    } else {
      if (length1) {
        result.push([length1, included1, included2]);
      }
      length1 = length2 = 0;
    }
  }
  return result;
}
function union(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 || included2);
  }
  return result;
}
function intersection(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 && included2);
  }
  return result;
}
function shrink(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).length) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (!included2) {
      pushSegment(result, length, included1);
    }
  }
  return result;
}
function expand(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).excludedLength) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (let i1 = 0, i2 = 0, length1 = 0, included1 = true, included2 = true; i2 < subseq2.length; i2++) {
    let length2 = subseq2[i2];
    included2 = !included2;
    if (included2) {
      pushSegment(result, length2, false);
    } else {
      while (length2) {
        if (length1 === 0) {
          length1 = subseq1[i1++];
          included1 = !included1;
        }
        const minLength = Math.min(length1, length2);
        pushSegment(result, minLength, included1);
        length1 -= minLength;
        length2 -= minLength;
      }
    }
  }
  return result;
}
function interleave(subseq1, subseq2) {
  if (measure(subseq1).excludedLength !== measure(subseq2).excludedLength) {
    throw new Error("Length mismatch");
  }
  const result1 = [];
  const result2 = [];
  for (let i1 = 0, i2 = 0, length1 = 0, length2 = 0, included1 = true, included2 = true; i1 < subseq1.length || i2 < subseq2.length; ) {
    if (length1 === 0 && i1 < subseq1.length) {
      length1 = subseq1[i1++];
      included1 = !included1;
    }
    if (length2 === 0 && i2 < subseq2.length) {
      length2 = subseq2[i2++];
      included2 = !included2;
    }
    if (included1 && included2) {
      pushSegment(result1, length1, true);
      pushSegment(result1, length2, false);
      pushSegment(result2, length1, false);
      pushSegment(result2, length2, true);
      length1 = length2 = 0;
    } else if (included1) {
      pushSegment(result1, length1, true);
      pushSegment(result2, length1, false);
      length1 = 0;
    } else if (included2) {
      pushSegment(result1, length2, false);
      pushSegment(result2, length2, true);
      length2 = 0;
    } else {
      const minLength = Math.min(length1, length2);
      pushSegment(result1, minLength, false);
      pushSegment(result2, minLength, false);
      length1 -= minLength;
      length2 -= minLength;
    }
  }
  return [result1, result2];
}
var Edit = class _Edit {
  constructor(parts) {
    validateEditParts(parts);
    this.parts = parts;
  }
  /** A string which represents a concatenation of all insertions. */
  get inserted() {
    let text = "";
    for (let i = 2; i < this.parts.length; i += 3) {
      const inserted = this.parts[i];
      text += inserted;
    }
    return text;
  }
  /** A string which represents a concatenation of all deletions. */
  get deleted() {
    let text = "";
    for (let i = 1; i < this.parts.length; i += 3) {
      const deleted = this.parts[i];
      text += deleted;
    }
    return text;
  }
  /**
   * Returns an array of operations, which is more readable than the parts
   * array.
   *
   *   new Edit([0, "old", "new", 3, "", "", 6]).operations();
   *   [
   *     {type: "delete", start: 0, end: 3, value: "old"},
   *     {type: "insert", start: 0, value: "new"},
   *     {type: "retain", start: 3, end: 6},
   *   ]
   *
   * When insertions and deletions happen at the same index, deletions will
   * always appear before insertions in the operations array (deletion-first format).
   */
  operations() {
    const operations = [];
    let currentPos = 0;
    if (this.parts.length === 1) {
      const finalPos2 = this.parts[0];
      if (finalPos2 > 0) {
        operations.push({
          type: "retain",
          start: 0,
          end: finalPos2
        });
      }
      return operations;
    }
    for (let i = 0; i < this.parts.length - 1; i += 3) {
      const position = this.parts[i];
      const deleted = this.parts[i + 1];
      const inserted = this.parts[i + 2];
      if (position > currentPos) {
        operations.push({
          type: "retain",
          start: currentPos,
          end: position
        });
      }
      if (deleted) {
        operations.push({
          type: "delete",
          start: position,
          end: position + deleted.length,
          value: deleted
        });
      }
      if (inserted) {
        operations.push({
          type: "insert",
          start: position,
          value: inserted
        });
      }
      currentPos = position + deleted.length;
    }
    const finalPos = this.parts[this.parts.length - 1];
    if (finalPos > currentPos) {
      operations.push({
        type: "retain",
        start: currentPos,
        end: finalPos
      });
    }
    return operations;
  }
  apply(text) {
    let result = "";
    let sourcePos = 0;
    const operations = this.operations();
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      switch (op.type) {
        case "retain":
          result += text.slice(sourcePos, sourcePos + (op.end - op.start));
          sourcePos += op.end - op.start;
          break;
        case "delete":
          sourcePos += op.end - op.start;
          break;
        case "insert":
          result += op.value;
          break;
      }
    }
    return result;
  }
  /** Composes two consecutive edits. */
  compose(that) {
    let [insertSeq1, inserted1, deleteSeq1, deleted1] = factor(this);
    let [insertSeq2, inserted2, deleteSeq2, deleted2] = factor(that);
    deleteSeq1 = expand(deleteSeq1, insertSeq1);
    deleteSeq2 = expand(deleteSeq2, deleteSeq1);
    [deleteSeq1, insertSeq2] = interleave(deleteSeq1, insertSeq2);
    deleteSeq2 = expand(deleteSeq2, insertSeq2);
    insertSeq1 = expand(insertSeq1, insertSeq2);
    {
      const toggleSeq = intersection(insertSeq1, deleteSeq2);
      if (measure(toggleSeq).includedLength) {
        deleteSeq1 = shrink(deleteSeq1, toggleSeq);
        inserted1 = erase(insertSeq1, inserted1, toggleSeq);
        insertSeq1 = shrink(insertSeq1, toggleSeq);
        deleteSeq2 = shrink(deleteSeq2, toggleSeq);
        insertSeq2 = shrink(insertSeq2, toggleSeq);
      }
    }
    const insertSeq = union(insertSeq1, insertSeq2);
    const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
    const deleteSeq = shrink(union(deleteSeq1, deleteSeq2), insertSeq);
    const deleted = consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2);
    return synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
  }
  invert() {
    let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
    deleteSeq = expand(deleteSeq, insertSeq);
    insertSeq = shrink(insertSeq, deleteSeq);
    return synthesize(deleteSeq, deleted, insertSeq, inserted);
  }
  normalize() {
    const insertSeq = [];
    const deleteSeq = [];
    let inserted = "";
    let deleted = "";
    let insertion;
    const operations = this.operations();
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      switch (op.type) {
        case "insert": {
          insertion = op.value;
          break;
        }
        case "retain": {
          if (insertion !== void 0) {
            pushSegment(insertSeq, insertion.length, true);
            inserted += insertion;
            insertion = void 0;
          }
          pushSegment(insertSeq, op.end - op.start, false);
          pushSegment(deleteSeq, op.end - op.start, false);
          break;
        }
        case "delete": {
          const length = op.end - op.start;
          const deletion = op.value;
          let prefix = 0;
          let suffix = 0;
          if (insertion !== void 0) {
            if (insertion === deletion) {
              prefix = deletion.length;
            } else {
              prefix = commonPrefixLength(insertion, deletion);
              const insertionRemainder = insertion.slice(prefix);
              const deletionRemainder = deletion.slice(prefix);
              suffix = commonSuffixLength(
                insertionRemainder,
                deletionRemainder
              );
            }
            pushSegment(insertSeq, prefix, false);
            pushSegment(insertSeq, insertion.length - prefix - suffix, true);
            inserted += insertion.slice(prefix, insertion.length - suffix);
          }
          deleted += deletion.slice(prefix, deletion.length - suffix);
          pushSegment(deleteSeq, prefix, false);
          pushSegment(deleteSeq, length - prefix - suffix, true);
          pushSegment(deleteSeq, suffix, false);
          pushSegment(insertSeq, length - prefix - suffix, false);
          pushSegment(insertSeq, suffix, false);
          insertion = void 0;
          break;
        }
      }
    }
    if (insertion !== void 0) {
      pushSegment(insertSeq, insertion.length, true);
      inserted += insertion;
    }
    const result = synthesize(insertSeq, inserted, deleteSeq, deleted);
    if (result.parts.length <= 1) {
      return result;
    }
    const compactedParts = [];
    for (let i = 0; i < result.parts.length - 1; i += 3) {
      const position = result.parts[i];
      const deleted2 = result.parts[i + 1];
      const inserted2 = result.parts[i + 2];
      if (deleted2 && inserted2) {
        const prefixLen = commonPrefixLength(deleted2, inserted2);
        const deletedRemainder = deleted2.slice(prefixLen);
        const insertedRemainder = inserted2.slice(prefixLen);
        const suffixLen = commonSuffixLength(
          deletedRemainder,
          insertedRemainder
        );
        if (prefixLen > 0 || suffixLen > 0) {
          const optimizedDeleted = deleted2.slice(
            prefixLen,
            deleted2.length - suffixLen
          );
          const optimizedInserted = inserted2.slice(
            prefixLen,
            inserted2.length - suffixLen
          );
          const optimizedPosition = position + prefixLen;
          if (optimizedDeleted || optimizedInserted) {
            compactedParts.push(
              optimizedPosition,
              optimizedDeleted,
              optimizedInserted
            );
          }
        } else {
          compactedParts.push(position, deleted2, inserted2);
        }
      } else {
        compactedParts.push(position, deleted2, inserted2);
      }
    }
    compactedParts.push(result.parts[result.parts.length - 1]);
    return new _Edit(compactedParts);
  }
  hasChangesBetween(start, end) {
    const ops = this.operations();
    for (const op of ops) {
      switch (op.type) {
        case "delete": {
          if (start <= op.start && op.start <= end || start <= op.end && op.end <= end) {
            return true;
          }
          break;
        }
        case "insert": {
          if (start <= op.start && op.start <= end) {
            return true;
          }
          break;
        }
      }
    }
    return false;
  }
  static builder(value = "") {
    let index = 0;
    let inserted = "";
    let deleted = "";
    const insertSeq = [];
    const deleteSeq = [];
    return {
      retain(length) {
        if (value != null && value !== "") {
          length = Math.min(value.length - index, length);
        }
        if (length > 0) {
          index += length;
          pushSegment(insertSeq, length, false);
          pushSegment(deleteSeq, length, false);
        }
        return this;
      },
      delete(length) {
        if (value != null && value !== "") {
          length = Math.min(value.length - index, length);
          deleted += value.slice(index, index + length);
        }
        index += length;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, true);
        return this;
      },
      insert(value2) {
        pushSegment(insertSeq, value2.length, true);
        inserted += value2;
        return this;
      },
      concat(edit) {
        const ops = edit.operations();
        for (const op of ops) {
          switch (op.type) {
            case "delete":
              this.delete(op.end - op.start);
              break;
            case "insert":
              this.insert(op.value);
              break;
            case "retain":
              this.retain(op.end - op.start);
              break;
          }
        }
        if (value != null && index > value.length) {
          throw new RangeError("Edit is longer than original value");
        }
        return this;
      },
      build() {
        if (value != null && index < value.length) {
          pushSegment(insertSeq, value.length - index, false);
          pushSegment(deleteSeq, value.length - index, false);
        }
        return synthesize(insertSeq, inserted, deleteSeq, deleted);
      }
    };
  }
  /**
   * Given two strings, this method finds an edit which can be applied to the
   * first string to result in the second.
   *
   * @param startHint - An optional hint can be provided to disambiguate edits
   * which cannot be inferred by comparing the text alone. For example,
   * inserting "a" into the string "aaaa" to make it "aaaaa" could be an
   * insertion at any index in the string. This value should be the smaller of
   * the start indices of the selection from before and after the edit.
   */
  static diff(text1, text2, startHint) {
    let prefix = commonPrefixLength(text1, text2);
    let suffix = commonSuffixLength(text1, text2);
    if (prefix + suffix > Math.min(text1.length, text2.length)) {
      if (startHint != null && startHint >= 0) {
        prefix = Math.min(prefix, startHint);
      }
      suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
    }
    return _Edit.builder(text1).retain(prefix).insert(text2.slice(prefix, text2.length - suffix)).delete(text1.length - prefix - suffix).retain(suffix).build();
  }
};
function synthesize(insertSeq, inserted, deleteSeq, deleted) {
  if (measure(insertSeq).includedLength !== inserted.length) {
    throw new Error("insertSeq and inserted string do not match in length");
  } else if (measure(deleteSeq).includedLength !== deleted.length) {
    throw new Error("deleteSeq and deleted string do not match in length");
  }
  const parts = [];
  let insertIndex = 0;
  let deleteIndex = 0;
  let position = 0;
  let pendingPos = -1;
  let pendingDeleted = "";
  let pendingInserted = "";
  function flushPending() {
    if (pendingPos >= 0 && (pendingDeleted || pendingInserted)) {
      parts.push(pendingPos, pendingDeleted, pendingInserted);
      pendingPos = -1;
      pendingDeleted = "";
      pendingInserted = "";
    }
  }
  const expandedDeleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, deleting, inserting] of align(
    expandedDeleteSeq,
    insertSeq
  )) {
    if (deleting || inserting) {
      const deletedText = deleting ? deleted.slice(deleteIndex, deleteIndex + length) : "";
      const insertedText = inserting ? inserted.slice(insertIndex, insertIndex + length) : "";
      if (pendingPos >= 0 && position === pendingPos + pendingDeleted.length) {
        pendingDeleted += deletedText;
        pendingInserted += insertedText;
      } else {
        flushPending();
        pendingPos = position;
        pendingDeleted = deletedText;
        pendingInserted = insertedText;
      }
      if (deleting) {
        deleteIndex += length;
      }
      if (inserting) {
        insertIndex += length;
      }
    }
    if (!inserting || deleting) {
      position += length;
    }
  }
  flushPending();
  const totalLength = measure(deleteSeq).length;
  parts.push(totalLength);
  return new Edit(parts);
}
function commonPrefixLength(text1, text2) {
  let min = 0;
  let max = Math.min(text1.length, text2.length);
  let mid = max;
  while (min < mid) {
    if (text1.slice(min, mid) === text2.slice(min, mid)) {
      min = mid;
    } else {
      max = mid;
    }
    mid = Math.floor((max - min) / 2 + min);
  }
  return mid;
}
function commonSuffixLength(text1, text2) {
  let min = 0;
  let max = Math.min(text1.length, text2.length);
  let mid = max;
  while (min < mid) {
    if (text1.slice(text1.length - mid, text1.length - min) === text2.slice(text2.length - mid, text2.length - min)) {
      min = mid;
    } else {
      max = mid;
    }
    mid = Math.floor((max - min) / 2 + min);
  }
  return mid;
}
function factor(edit) {
  const insertSeq = [];
  const deleteSeq = [];
  let inserted = "";
  let deleted = "";
  const operations = edit.operations();
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    switch (op.type) {
      case "retain": {
        const length = op.end - op.start;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, false);
        break;
      }
      case "delete": {
        const length = op.end - op.start;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, true);
        deleted += op.value;
        break;
      }
      case "insert":
        pushSegment(insertSeq, op.value.length, true);
        inserted += op.value;
        break;
    }
  }
  return [insertSeq, inserted, deleteSeq, deleted];
}
function consolidate(subseq1, text1, subseq2, text2) {
  let i1 = 0;
  let i2 = 0;
  let result = "";
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (included1 && included2) {
      throw new Error("Overlapping subseqs");
    } else if (included1) {
      result += text1.slice(i1, i1 + length);
      i1 += length;
    } else if (included2) {
      result += text2.slice(i2, i2 + length);
      i2 += length;
    }
  }
  return result;
}
function erase(subseq1, str, subseq2) {
  let i = 0;
  let result = "";
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (included1) {
      if (!included2) {
        result += str.slice(i, i + length);
      }
      i += length;
    } else if (included2) {
      throw new Error("Non-overlapping subseqs");
    }
  }
  return result;
}
function validateEditParts(parts) {
  if (parts.length === 0) {
    throw new Error("Edit parts cannot be empty");
  }
  if (parts.length !== 1 && (parts.length - 1) % 3 !== 0) {
    throw new Error(
      `Edit parts length ${parts.length} is invalid - must be 1 or (operations * 3 + 1)`
    );
  }
  if (parts.length === 1) {
    if (typeof parts[0] !== "number") {
      throw new Error("Single-element edit must be a number (final position)");
    }
    if (parts[0] < 0) {
      throw new Error("Final position cannot be negative");
    }
    return;
  }
  const finalPos = parts[parts.length - 1];
  if (typeof finalPos !== "number") {
    throw new Error("Final position must be a number");
  }
  if (finalPos < 0) {
    throw new Error("Final position cannot be negative");
  }
  let previousPos = -1;
  for (let i = 0; i < parts.length - 1; i += 3) {
    const position = parts[i];
    const deleted = parts[i + 1];
    const inserted = parts[i + 2];
    if (typeof position !== "number") {
      throw new Error(
        `Position at index ${i} must be a number, got ${typeof position}`
      );
    }
    if (typeof deleted !== "string") {
      throw new Error(
        `Deleted at index ${i + 1} must be a string, got ${typeof deleted}`
      );
    }
    if (typeof inserted !== "string") {
      throw new Error(
        `Inserted at index ${i + 2} must be a string, got ${typeof inserted}`
      );
    }
    if (position < 0) {
      throw new Error(`Position ${position} at index ${i} cannot be negative`);
    }
    if (position <= previousPos) {
      throw new Error(
        `Position ${position} at index ${i} must be > previous end position ${previousPos}`
      );
    }
    const deletionEnd = position + deleted.length;
    const nextIndex = i + 3;
    if (nextIndex < parts.length - 1) {
      const nextPos = parts[nextIndex];
      if (deletionEnd > nextPos) {
        throw new Error(
          `Deletion at position ${position} extends to ${deletionEnd}, exceeding next position ${nextPos}`
        );
      }
    } else {
      if (deletionEnd > finalPos) {
        throw new Error(
          `Deletion at position ${position} extends to ${deletionEnd}, exceeding final position ${finalPos}`
        );
      }
    }
    previousPos = deletionEnd;
  }
  if (previousPos > finalPos) {
    throw new Error(
      `Operations extend to position ${previousPos}, exceeding final position ${finalPos}`
    );
  }
}

// ../packages/crankeditable/node_modules/@b9g/revise/src/contentarea.js
var _cache = /* @__PURE__ */ Symbol.for("ContentArea._cache");
var _observer = /* @__PURE__ */ Symbol.for("ContentArea._observer");
var _onselectionchange = /* @__PURE__ */ Symbol.for("ContentArea._onselectionchange");
var _value = /* @__PURE__ */ Symbol.for("ContentArea._value");
var _selectionRange = /* @__PURE__ */ Symbol.for("ContentArea._selectionRange");
var _staleValue = /* @__PURE__ */ Symbol.for("ContentArea._staleValue");
var _staleSelectionRange = /* @__PURE__ */ Symbol.for("ContentArea._slateSelectionRange");
var _compositionBuffer = /* @__PURE__ */ Symbol.for("ContentArea._compositionBuffer");
var _compositionStartValue = /* @__PURE__ */ Symbol.for("ContentArea._compositionStartValue");
var _compositionSelectionRange = /* @__PURE__ */ Symbol.for(
  "ContentArea._compositionSelectionRange"
);
var ContentAreaElement = class extends HTMLElement {
  constructor() {
    super();
    this[_cache] = /* @__PURE__ */ new Map();
    this[_observer] = new MutationObserver((records) => {
      if (this[_compositionBuffer]) {
        this[_compositionBuffer].push(...records);
      }
      validate(this, records);
    });
    this[_onselectionchange] = () => {
      this[_selectionRange] = getSelectionRange(this);
    };
    this[_value] = "";
    this[_selectionRange] = { start: 0, end: 0, direction: "none" };
    this[_staleValue] = void 0;
    this[_staleSelectionRange] = void 0;
    this[_compositionBuffer] = void 0;
    this[_compositionStartValue] = void 0;
    this[_compositionSelectionRange] = void 0;
  }
  /******************************/
  /*** Custom Element methods ***/
  /******************************/
  connectedCallback() {
    this[_observer].observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [
        "data-content"
        // TODO: implement these attributes
        //"data-contentbefore",
        //"data-contentafter",
      ]
    });
    document.addEventListener(
      "selectionchange",
      this[_onselectionchange],
      // We use capture in an attempt to run before other event listeners.
      true
    );
    validate(this);
    this[_onselectionchange]();
    let processCompositionTimeout;
    this.addEventListener("compositionstart", () => {
      clearTimeout(processCompositionTimeout);
      if (processCompositionTimeout == null) {
        this[_compositionBuffer] = [];
        this[_compositionStartValue] = this[_value];
        this[_compositionSelectionRange] = { ...this[_selectionRange] };
      }
      processCompositionTimeout = void 0;
    });
    const processComposition = () => {
      if (this[_compositionBuffer] && this[_compositionBuffer].length > 0 && this[_compositionStartValue] !== void 0 && this[_compositionSelectionRange] !== void 0) {
        const edit = Edit.diff(
          this[_compositionStartValue],
          this[_value],
          this[_compositionSelectionRange].start
        );
        const ev = new ContentEvent("contentchange", {
          detail: { edit, source: null, mutations: this[_compositionBuffer] }
        });
        this.dispatchEvent(ev);
        this[_staleValue] = void 0;
        this[_staleSelectionRange] = void 0;
      }
      this[_compositionBuffer] = void 0;
      this[_compositionStartValue] = void 0;
      this[_compositionSelectionRange] = void 0;
      processCompositionTimeout = void 0;
    };
    this.addEventListener("compositionend", () => {
      clearTimeout(processCompositionTimeout);
      processCompositionTimeout = setTimeout(processComposition);
    });
    this.addEventListener("blur", () => {
      clearTimeout(processCompositionTimeout);
      processComposition();
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this[_compositionBuffer]) {
        clearTimeout(processCompositionTimeout);
        processComposition();
      }
    });
  }
  disconnectedCallback() {
    this[_cache].clear();
    this[_value] = "";
    this[_observer].disconnect();
    if (document) {
      document.removeEventListener(
        "selectionchange",
        this[_onselectionchange],
        true
      );
    }
  }
  get value() {
    validate(this);
    return this[_staleValue] == null ? this[_value] : this[_staleValue];
  }
  get selectionStart() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.start;
  }
  set selectionStart(start) {
    validate(this);
    const { end, direction } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  get selectionEnd() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.end;
  }
  set selectionEnd(end) {
    validate(this);
    const { start, direction } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  get selectionDirection() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.direction;
  }
  set selectionDirection(direction) {
    validate(this);
    const { start, end } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  getSelectionRange() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return { ...range };
  }
  setSelectionRange(start, end, direction = "none") {
    validate(this);
    setSelectionRange(this, { start, end, direction });
  }
  indexAt(node, offset) {
    validate(this);
    return indexAt(this, node, offset);
  }
  nodeOffsetAt(index) {
    validate(this);
    return nodeOffsetAt(this, index);
  }
  source(source) {
    return validate(this, this[_observer].takeRecords(), source);
  }
};
var PreventDefaultSource = /* @__PURE__ */ Symbol.for("ContentArea.PreventDefaultSource");
var ContentEvent = class extends CustomEvent {
  constructor(typeArg, eventInit) {
    super(typeArg, { bubbles: true, ...eventInit });
  }
  preventDefault() {
    if (this.defaultPrevented) {
      return;
    }
    super.preventDefault();
    const area = this.target;
    area[_staleValue] = area[_value];
    area[_staleSelectionRange] = area[_selectionRange];
    const records = this.detail.mutations;
    for (let i = records.length - 1; i >= 0; i--) {
      const record = records[i];
      switch (record.type) {
        case "childList": {
          for (let j = 0; j < record.addedNodes.length; j++) {
            const node = record.addedNodes[j];
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          }
          for (let j = 0; j < record.removedNodes.length; j++) {
            const node = record.removedNodes[j];
            record.target.insertBefore(node, record.nextSibling);
          }
          break;
        }
        case "characterData": {
          if (record.oldValue !== null) {
            record.target.data = record.oldValue;
          }
          break;
        }
        case "attributes": {
          if (record.oldValue === null) {
            record.target.removeAttribute(record.attributeName);
          } else {
            record.target.setAttribute(
              record.attributeName,
              record.oldValue
            );
          }
          break;
        }
      }
    }
    const records1 = area[_observer].takeRecords();
    validate(area, records1, PreventDefaultSource);
  }
};
var IS_OLD = 1 << 0;
var IS_VALID = 1 << 1;
var IS_BLOCKLIKE = 1 << 2;
var PREPENDS_NEWLINE = 1 << 3;
var APPENDS_NEWLINE = 1 << 4;
var NodeInfo = class {
  constructor(offset) {
    this.f = 0;
    this.offset = offset;
    this.length = 0;
  }
};
function validate(_this, records = _this[_observer].takeRecords(), source = null) {
  if (typeof _this !== "object" || _this[_cache] == null) {
    throw new TypeError("this is not a ContentAreaElement");
  } else if (!document.contains(_this)) {
    throw new Error(
      "ContentArea cannot be read before it is inserted into the DOM"
    );
  }
  if (!invalidate(_this, records)) {
    return false;
  }
  const oldValue = _this[_value];
  const edit = diff(_this, oldValue, _this[_selectionRange].start);
  _this[_value] = edit.apply(oldValue);
  _this[_selectionRange] = getSelectionRange(_this);
  if (source !== PreventDefaultSource && !_this[_compositionBuffer]) {
    const ev = new ContentEvent("contentchange", {
      detail: { edit, source, mutations: records }
    });
    _this.dispatchEvent(ev);
    _this[_staleValue] = void 0;
    _this[_staleSelectionRange] = void 0;
  }
  return true;
}
function invalidate(_this, records) {
  const cache = _this[_cache];
  if (!cache.get(_this)) {
    return true;
  }
  let invalid = false;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    for (let j = 0; j < record.addedNodes.length; j++) {
      const addedNode = record.addedNodes[j];
      clear(addedNode, cache);
    }
    for (let j = 0; j < record.removedNodes.length; j++) {
      clear(record.removedNodes[j], cache);
    }
    let node = record.target;
    if (node === _this) {
      invalid = true;
      continue;
    } else if (!_this.contains(node)) {
      clear(node, cache);
      continue;
    }
    for (; node !== _this; node = node.parentNode) {
      if (!cache.has(node)) {
        break;
      }
      const nodeInfo = cache.get(node);
      if (nodeInfo) {
        nodeInfo.f &= ~IS_VALID;
      }
      invalid = true;
    }
  }
  if (invalid) {
    const nodeInfo = cache.get(_this);
    nodeInfo.f &= ~IS_VALID;
  }
  return invalid;
}
function clear(parent, cache) {
  const walker = document.createTreeWalker(
    parent,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  for (let node = parent; node !== null; node = walker.nextNode()) {
    cache.delete(node);
  }
}
var NEWLINE = "\n";
function diff(_this, oldValue, oldSelectionStart) {
  const walker = document.createTreeWalker(
    _this,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  const cache = _this[_cache];
  const stack = [];
  let nodeInfo;
  let value = "";
  for (let node = _this, descending = true, offset = 0, oldIndex = 0, oldIndexRelative = 0, hasNewline = false; ; node = walker.currentNode) {
    if (descending) {
      nodeInfo = cache.get(node);
      if (nodeInfo === void 0) {
        cache.set(node, nodeInfo = new NodeInfo(offset));
        if (isBlocklikeElement(node)) {
          nodeInfo.f |= IS_BLOCKLIKE;
        }
      } else {
        const expectedOffset = oldIndex - oldIndexRelative;
        const deleteLength = nodeInfo.offset - expectedOffset;
        if (deleteLength < 0) {
          throw new Error("cache offset error");
        } else if (deleteLength > 0) {
          oldIndex += deleteLength;
        }
        nodeInfo.offset = offset;
      }
      if (offset && !hasNewline && nodeInfo.f & IS_BLOCKLIKE) {
        hasNewline = true;
        offset += NEWLINE.length;
        value += NEWLINE;
        if (nodeInfo.f & PREPENDS_NEWLINE) {
          oldIndex += NEWLINE.length;
        }
        nodeInfo.f |= PREPENDS_NEWLINE;
      } else {
        if (nodeInfo.f & PREPENDS_NEWLINE) {
          oldIndex += NEWLINE.length;
        }
        nodeInfo.f &= ~PREPENDS_NEWLINE;
      }
      descending = false;
      if (nodeInfo.f & IS_VALID) {
        if (nodeInfo.length) {
          value += oldValue.slice(oldIndex, oldIndex + nodeInfo.length);
          oldIndex += nodeInfo.length;
          offset += nodeInfo.length;
          hasNewline = oldValue.slice(Math.max(0, oldIndex - NEWLINE.length), oldIndex) === NEWLINE;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.data;
        if (text.length) {
          value += text;
          offset += text.length;
          hasNewline = text.endsWith(NEWLINE);
        }
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else if (node.hasAttribute("data-content")) {
        const text = node.getAttribute("data-content") || "";
        if (text.length) {
          value += text;
          offset += text.length;
          hasNewline = text.endsWith(NEWLINE);
        }
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else if (node.nodeName === "BR") {
        value += NEWLINE;
        offset += NEWLINE.length;
        hasNewline = true;
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else {
        descending = !!walker.firstChild();
        if (descending) {
          stack.push({ nodeInfo, oldIndexRelative });
          offset = 0;
          oldIndexRelative = oldIndex;
        }
      }
    } else {
      if (!stack.length) {
        throw new Error("Stack is empty");
      }
      if (nodeInfo.f & PREPENDS_NEWLINE) {
        offset += NEWLINE.length;
      }
      ({ nodeInfo, oldIndexRelative } = stack.pop());
      offset = nodeInfo.offset + offset;
    }
    if (!descending) {
      if (!(nodeInfo.f & IS_VALID)) {
        if (!hasNewline && nodeInfo.f & IS_BLOCKLIKE) {
          value += NEWLINE;
          offset += NEWLINE.length;
          hasNewline = true;
          nodeInfo.f |= APPENDS_NEWLINE;
        } else {
          nodeInfo.f &= ~APPENDS_NEWLINE;
        }
        nodeInfo.length = offset - nodeInfo.offset;
        nodeInfo.f |= IS_VALID;
      }
      nodeInfo.f |= IS_OLD;
      descending = !!walker.nextSibling();
      if (!descending) {
        if (walker.currentNode === _this) {
          break;
        }
        walker.parentNode();
      }
    }
    if (oldIndex > oldValue.length) {
      throw new Error("cache length error");
    }
  }
  const selectionStart = getSelectionRange(_this).start;
  return Edit.diff(
    oldValue,
    value,
    Math.min(oldSelectionStart, selectionStart)
  );
}
var BLOCKLIKE_DISPLAYS = /* @__PURE__ */ new Set([
  "block",
  "flex",
  "grid",
  "flow-root",
  "list-item",
  "table",
  "table-row-group",
  "table-header-group",
  "table-footer-group",
  "table-row",
  "table-caption"
]);
function isBlocklikeElement(node) {
  return node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_DISPLAYS.has(
    // handle two-value display syntax like `display: block flex`
    getComputedStyle(node).display.split(" ")[0]
  );
}
function indexAt(_this, node, offset) {
  const cache = _this[_cache];
  if (node == null || !_this.contains(node)) {
    return -1;
  }
  if (!cache.has(node)) {
    offset = 0;
    while (!cache.has(node)) {
      node = node.parentNode;
    }
  }
  let index;
  if (node.nodeType === Node.TEXT_NODE) {
    const nodeInfo = cache.get(node);
    index = offset + nodeInfo.offset;
    node = node.parentNode;
  } else {
    if (offset <= 0) {
      index = 0;
    } else if (offset >= node.childNodes.length) {
      const nodeInfo = cache.get(node);
      index = nodeInfo.f & APPENDS_NEWLINE ? nodeInfo.length - NEWLINE.length : nodeInfo.length;
    } else {
      let child = node.childNodes[offset];
      while (child !== null && !cache.has(child)) {
        child = child.previousSibling;
      }
      if (child === null) {
        index = 0;
      } else {
        node = child;
        const nodeInfo = cache.get(node);
        index = nodeInfo.f & PREPENDS_NEWLINE ? -1 : 0;
      }
    }
  }
  for (; node !== _this; node = node.parentNode) {
    const nodeInfo = cache.get(node);
    index += nodeInfo.offset;
    if (nodeInfo.f & PREPENDS_NEWLINE) {
      index += NEWLINE.length;
    }
  }
  return index;
}
function nodeOffsetAt(_this, index) {
  if (index < 0) {
    return [null, 0];
  }
  const [node, offset] = findNodeOffset(_this, index);
  if (node && node.nodeName === "BR") {
    return nodeOffsetFromChild(node);
  }
  return [node, offset];
}
function findNodeOffset(_this, index) {
  const cache = _this[_cache];
  const walker = document.createTreeWalker(
    _this,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  for (let node2 = _this; node2 !== null; ) {
    const nodeInfo = cache.get(node2);
    if (nodeInfo == null) {
      return nodeOffsetFromChild(node2, index > 0);
    }
    if (nodeInfo.f & PREPENDS_NEWLINE) {
      index -= 1;
    }
    if (index === nodeInfo.length && node2.nodeType === Node.TEXT_NODE) {
      return [node2, node2.data.length];
    } else if (index >= nodeInfo.length) {
      index -= nodeInfo.length;
      const nextSibling = walker.nextSibling();
      if (nextSibling === null) {
        if (node2 === _this) {
          return [node2, getNodeLength(node2)];
        }
        return nodeOffsetFromChild(walker.currentNode, true);
      }
      node2 = nextSibling;
    } else {
      if (node2.nodeType === Node.ELEMENT_NODE && node2.hasAttribute("data-content")) {
        return nodeOffsetFromChild(node2, index > 0);
      }
      const firstChild = walker.firstChild();
      if (firstChild === null) {
        const offset = node2.nodeType === Node.TEXT_NODE ? index : index > 0 ? 1 : 0;
        return [node2, offset];
      } else {
        node2 = firstChild;
      }
    }
  }
  const node = walker.currentNode;
  return [node, getNodeLength(node)];
}
function getNodeLength(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.data.length;
  }
  return node.childNodes.length;
}
function nodeOffsetFromChild(node, after = false) {
  const parentNode = node.parentNode;
  if (parentNode === null) {
    return [null, 0];
  }
  let offset = Array.from(parentNode.childNodes).indexOf(node);
  if (after) {
    offset++;
  }
  return [parentNode, offset];
}
function getSelectionRange(_this) {
  const selection = document.getSelection();
  if (!selection) {
    return { start: 0, end: 0, direction: "none" };
  }
  const { focusNode, focusOffset, anchorNode, anchorOffset, isCollapsed } = selection;
  const focus = Math.max(0, indexAt(_this, focusNode, focusOffset));
  const anchor = isCollapsed ? focus : Math.max(0, indexAt(_this, anchorNode, anchorOffset));
  return {
    start: Math.min(focus, anchor),
    end: Math.max(focus, anchor),
    direction: focus < anchor ? "backward" : focus > anchor ? "forward" : "none"
  };
}
function setSelectionRange(_this, { start, end, direction }) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  start = Math.max(0, start || 0);
  end = Math.max(0, end || 0);
  if (end < start) {
    start = end;
  }
  const [focus, anchor] = direction === "backward" ? [start, end] : [end, start];
  if (focus === anchor) {
    const [node, offset] = nodeOffsetAt(_this, focus);
    selection.collapse(node, offset);
  } else {
    const [anchorNode, anchorOffset] = nodeOffsetAt(_this, anchor);
    const [focusNode, focusOffset] = nodeOffsetAt(_this, focus);
    if (anchorNode === null && focusNode === null) {
      selection.collapse(null);
    } else if (anchorNode === null) {
      selection.collapse(focusNode, focusOffset);
    } else if (focusNode === null) {
      selection.collapse(anchorNode, anchorOffset);
    } else {
      selection.setBaseAndExtent(
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      );
    }
  }
}

// ../packages/crankeditable/node_modules/@b9g/revise/src/history.js
function isNoop(edit) {
  const operations = edit.operations();
  return operations.length === 1 && operations[0].type === "retain";
}
function isComplex(edit) {
  let count = 0;
  for (const op of edit.operations()) {
    if (op.type !== "retain") {
      count++;
      if (count > 1) {
        return true;
      }
    }
  }
  return false;
}
var EditHistory = class {
  current;
  undoStack;
  redoStack;
  constructor() {
    this.current = void 0;
    this.undoStack = [];
    this.redoStack = [];
  }
  checkpoint() {
    if (this.current) {
      this.undoStack.push(this.current);
      this.current = void 0;
    }
  }
  append(edit) {
    if (isNoop(edit)) {
      return;
    } else if (this.redoStack.length) {
      this.redoStack.length = 0;
    }
    if (this.current) {
      const oldEdit = this.current;
      if (!isComplex(oldEdit) && !isComplex(edit)) {
        this.current = oldEdit.compose(edit);
        return;
      } else {
        this.checkpoint();
      }
    }
    this.current = edit;
  }
  canUndo() {
    return !!(this.current || this.undoStack.length);
  }
  undo() {
    this.checkpoint();
    const edit = this.undoStack.pop();
    if (edit) {
      this.redoStack.push(edit);
      return edit.invert();
    }
  }
  canRedo() {
    return !!this.redoStack.length;
  }
  redo() {
    this.checkpoint();
    const edit = this.redoStack.pop();
    if (edit) {
      this.undoStack.push(edit);
      return edit;
    }
  }
};

// ../packages/crankeditable/node_modules/@b9g/revise/src/keyer.js
var Keyer = class {
  nextKey;
  keys;
  // TODO: Accept a custom key function.
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

// ../packages/crankeditable/node_modules/@b9g/revise/src/state.js
function selectionRangeFromEdit(edit) {
  const ops = edit.operations();
  let newIndex = 0;
  let start;
  let end;
  for (const op of ops) {
    switch (op.type) {
      case "retain":
        newIndex += op.end - op.start;
        break;
      case "delete":
        if (start === void 0)
          start = newIndex;
        end = newIndex;
        break;
      case "insert":
        if (start === void 0)
          start = newIndex;
        newIndex += op.value.length;
        end = newIndex;
        break;
    }
  }
  if (start === void 0)
    return void 0;
  return { start, end, direction: "none" };
}
var EditableState = class {
  #value;
  #history;
  #keyer;
  #selection;
  #source;
  get value() {
    return this.#value;
  }
  get history() {
    return this.#history;
  }
  get keyer() {
    return this.#keyer;
  }
  get selection() {
    return this.#selection;
  }
  get source() {
    return this.#source;
  }
  constructor(options) {
    this.#value = (options == null ? void 0 : options.value) ?? "";
    this.#history = new EditHistory();
    this.#keyer = new Keyer();
    this.#selection = void 0;
    this.#source = null;
  }
  applyEdit(edit, options) {
    let source;
    let recordHistory = true;
    if (typeof options === "string") {
      source = options;
    } else if (options) {
      source = options.source;
      recordHistory = options.history ?? true;
    }
    edit = edit.normalize();
    this.#value = edit.apply(this.#value);
    this.#keyer.transform(edit);
    if (recordHistory && source !== "history") {
      this.#history.append(edit);
    }
    this.#selection = selectionRangeFromEdit(edit);
    this.#source = source ?? null;
  }
  setValue(newValue, options) {
    const edit = Edit.diff(this.#value, newValue);
    this.applyEdit(edit, options);
  }
  undo() {
    const edit = this.#history.undo();
    if (!edit)
      return false;
    this.applyEdit(edit, "history");
    return true;
  }
  redo() {
    const edit = this.#history.redo();
    if (!edit)
      return false;
    this.applyEdit(edit, "history");
    return true;
  }
  canUndo() {
    return this.#history.canUndo();
  }
  canRedo() {
    return this.#history.canRedo();
  }
  checkpoint() {
    this.#history.checkpoint();
  }
  reset(value = "") {
    this.#value = value;
    this.#history = new EditHistory();
    this.#keyer = new Keyer();
    this.#selection = void 0;
    this.#source = "reset";
  }
};

// ../packages/crankeditable/dist/src/crank-editable.js
function* Editable({ state, children }) {
  if (!customElements.get("content-area")) {
    customElements.define("content-area", ContentAreaElement);
  }
  let lastEditSelection;
  let pendingSelection;
  let area;
  let initial = true;
  const dispatchStateChange = () => {
    this.dispatchEvent(new Event("statechange", { bubbles: true }));
  };
  this.addEventListener("contentchange", (ev) => {
    const { edit, source } = ev.detail;
    if (source === "render") {
      return;
    }
    if (initial) {
      initial = false;
      return;
    }
    const target = ev.target;
    pendingSelection = target.getSelectionRange();
    ev.preventDefault();
    state.applyEdit(edit);
    lastEditSelection = pendingSelection;
    dispatchStateChange();
  });
  this.addEventListener("beforeinput", (ev) => {
    const { inputType } = ev;
    switch (inputType) {
      case "historyUndo": {
        ev.preventDefault();
        if (state.undo()) {
          lastEditSelection = state.selection;
          dispatchStateChange();
        }
        break;
      }
      case "historyRedo": {
        ev.preventDefault();
        if (state.redo()) {
          lastEditSelection = state.selection;
          dispatchStateChange();
        }
        break;
      }
    }
  });
  this.addEventListener("keydown", (ev) => {
    const kev = ev;
    const mod = kev.metaKey || kev.ctrlKey;
    if (!mod)
      return;
    let handled = false;
    if (kev.key === "z" || kev.key === "Z") {
      kev.preventDefault();
      handled = kev.shiftKey ? state.redo() : state.undo();
    } else if (kev.key === "y" && kev.ctrlKey && !kev.metaKey) {
      kev.preventDefault();
      handled = state.redo();
    }
    if (handled) {
      lastEditSelection = state.selection;
      dispatchStateChange();
    }
  });
  const onselectionchange = () => {
    if (!area)
      return;
    const sel = area.getSelectionRange();
    if (lastEditSelection && (lastEditSelection.start !== sel.start || lastEditSelection.end !== sel.end)) {
      state.checkpoint();
    }
    lastEditSelection = sel;
  };
  document.addEventListener("selectionchange", onselectionchange);
  this.cleanup(() => {
    document.removeEventListener("selectionchange", onselectionchange);
  });
  let oldSelectionRange;
  for ({ state, children } of this) {
    const selectionRange = pendingSelection ?? state.selection ?? oldSelectionRange;
    pendingSelection = void 0;
    this.after((el) => {
      area = el;
      el.source("render");
      if (selectionRange) {
        el.setSelectionRange(
          selectionRange.start,
          selectionRange.end,
          selectionRange.direction
        );
        const sel = document.getSelection();
        if (sel && sel.focusNode) {
          const focusEl = sel.focusNode.nodeType === Node.ELEMENT_NODE ? sel.focusNode : sel.focusNode.parentElement;
          if (focusEl) {
            focusEl.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }
      }
    });
    const areaEl = yield createElement(
      "content-area",
      null,
      children
    );
    oldSelectionRange = areaEl.getSelectionRange();
  }
}
var CrankEditable = Editable;
export {
  ContentAreaElement,
  CrankEditable,
  Editable,
  EditableState
};
