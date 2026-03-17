// ../dist/src/_chunks/chunk-CETUMGXV.js
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../dist/src/edit.js
var subseq_exports = {};
__export(subseq_exports, {
  align: () => align,
  clear: () => clear,
  complement: () => complement,
  contains: () => contains,
  difference: () => difference,
  expand: () => expand,
  fill: () => fill,
  interleave: () => interleave,
  intersection: () => intersection,
  mask: () => mask,
  measure: () => measure,
  pushSegment: () => pushSegment,
  shrink: () => shrink,
  union: () => union
});
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
function contains(subseq, index) {
  if (index < 0) {
    return false;
  }
  for (let i = 0; i < subseq.length; i++) {
    index -= subseq[i];
    if (index < 0) {
      return i % 2 === 1;
    }
  }
  return false;
}
function clear(subseq) {
  const { length } = measure(subseq);
  return length ? [length] : [];
}
function fill(subseq) {
  const { length } = measure(subseq);
  return length ? [0, length] : [];
}
function complement(subseq) {
  return subseq[0] === 0 ? subseq.slice(1) : [0, ...subseq];
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
function difference(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 && !included2);
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
function mask(subseq1, subseq2) {
  const length2 = measure(subseq2).length;
  const result = [];
  let excludedPos = 0;
  let j = 0, pos2 = 0, included2 = false;
  let remaining2 = subseq2.length > 0 ? subseq2[0] : 0;
  for (let i = 0; i < subseq1.length; i++) {
    const len = subseq1[i];
    if (i % 2 === 0) {
      pushSegment(result, len, false);
      excludedPos += len;
    } else {
      while (pos2 + remaining2 <= excludedPos && j < subseq2.length - 1) {
        pos2 += remaining2;
        j++;
        included2 = j % 2 === 1;
        remaining2 = subseq2[j];
      }
      pushSegment(
        result,
        len,
        excludedPos > 0 && excludedPos < length2 && included2 && pos2 < excludedPos
      );
    }
  }
  return result;
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
    let [insertSeqA, insertedA, deleteSeqA, deletedA] = factor(this);
    let [insertSeqB, insertedB, deleteSeqB, deletedB] = factor(that);
    deleteSeqA = expand(deleteSeqA, insertSeqA);
    deleteSeqB = expand(deleteSeqB, deleteSeqA);
    [deleteSeqA, insertSeqB] = interleave(deleteSeqA, insertSeqB);
    deleteSeqB = expand(deleteSeqB, insertSeqB);
    insertSeqA = expand(insertSeqA, insertSeqB);
    {
      const toggleSeq = intersection(insertSeqA, deleteSeqB);
      if (measure(toggleSeq).includedLength) {
        deleteSeqA = shrink(deleteSeqA, toggleSeq);
        insertedA = erase(insertSeqA, insertedA, toggleSeq);
        insertSeqA = shrink(insertSeqA, toggleSeq);
        deletedB = erase(deleteSeqB, deletedB, toggleSeq);
        deleteSeqB = shrink(deleteSeqB, toggleSeq);
        insertSeqB = shrink(insertSeqB, toggleSeq);
      }
    }
    const insertSeq = union(insertSeqA, insertSeqB);
    const inserted = consolidate(insertSeqA, insertedA, insertSeqB, insertedB);
    const deleteSeq = shrink(union(deleteSeqA, deleteSeqB), insertSeq);
    const deleted = consolidate(deleteSeqA, deletedA, deleteSeqB, deletedB);
    return synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
  }
  invert() {
    let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
    deleteSeq = expand(deleteSeq, insertSeq);
    insertSeq = shrink(insertSeq, deleteSeq);
    return synthesize(deleteSeq, deleted, insertSeq, inserted);
  }
  /**
   * Transforms two concurrent edits against the same base document.
   *
   * Given edits A and B both applicable to the same document s0, returns
   * [A', B'] such that:
   *   B'.apply(A.apply(s0)) === A'.apply(B.apply(s0))
   *
   * A' is A adjusted to apply after B has been applied.
   * B' is B adjusted to apply after A has been applied.
   *
   * When both edits insert at the same position, `this` (A) gets left
   * priority (its insertion appears first in the converged result).
   */
  transform(that) {
    const [insertSeqL, insertedL, deleteSeqL, deletedL] = factor(this);
    const [insertSeqR, insertedR, deleteSeqR, deletedR] = factor(that);
    const maskL = mask(insertSeqL, deleteSeqR);
    const maskR = mask(insertSeqR, deleteSeqL);
    const hasCanceledL = measure(maskL).includedLength > 0;
    const hasCanceledR = measure(maskR).includedLength > 0;
    const insertSeqL1 = hasCanceledL ? shrink(insertSeqL, maskL) : insertSeqL;
    const insertedL1 = hasCanceledL ? erase(insertSeqL, insertedL, maskL) : insertedL;
    const insertSeqR1 = hasCanceledR ? shrink(insertSeqR, maskR) : insertSeqR;
    const insertedR1 = hasCanceledR ? erase(insertSeqR, insertedR, maskR) : insertedR;
    const [insertSeqL2, insertSeqR2] = interleave(insertSeqL1, insertSeqR1);
    const insertSeqUnion = union(insertSeqL2, insertSeqR2);
    const deleteSeqL1 = expand(deleteSeqL, insertSeqUnion);
    const deleteSeqR1 = expand(deleteSeqR, insertSeqUnion);
    const deleteOnlyL = difference(deleteSeqL1, deleteSeqR1);
    const deleteOnlyR = difference(deleteSeqR1, deleteSeqL1);
    const deleteOverlap = intersection(deleteSeqL, deleteSeqR);
    const deletedL1 = erase(deleteSeqL, deletedL, deleteOverlap);
    const deletedR1 = erase(deleteSeqR, deletedR, deleteOverlap);
    const insertSeqL3 = shrink(insertSeqL2, deleteSeqR1);
    const deleteOnlyL1 = shrink(deleteOnlyL, deleteSeqR1);
    const deleteSeqL2 = shrink(deleteOnlyL1, insertSeqL3);
    const insertSeqR3 = shrink(insertSeqR2, deleteSeqL1);
    const deleteOnlyR1 = shrink(deleteOnlyR, deleteSeqL1);
    const deleteSeqR2 = shrink(deleteOnlyR1, insertSeqR3);
    let resultL = synthesize(insertSeqL3, insertedL1, deleteSeqL2, deletedL1).normalize();
    let resultR = synthesize(insertSeqR3, insertedR1, deleteSeqR2, deletedR1).normalize();
    if (hasCanceledR) {
      const canceledTextR = erase(insertSeqR, insertedR, difference(insertSeqR, maskR));
      const canceledSeqR = shrink(maskR, expand(deleteSeqR, insertSeqR));
      resultL = synthesize(clear(canceledSeqR), "", canceledSeqR, canceledTextR).compose(resultL);
    }
    if (hasCanceledL) {
      const canceledTextL = erase(insertSeqL, insertedL, difference(insertSeqL, maskL));
      const canceledSeqL = shrink(maskL, expand(deleteSeqL, insertSeqL));
      resultR = synthesize(clear(canceledSeqL), "", canceledSeqL, canceledTextL).compose(resultR);
    }
    return [resultL, resultR];
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
export {
  Edit,
  subseq_exports as Subseq
};
