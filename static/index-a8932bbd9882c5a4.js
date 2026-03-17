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

// ../dist/src/contentarea.js
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
        "data-content",
        "data-contentbefore",
        "data-contentafter"
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
    this.beforeLength = 0;
    this.afterLength = 0;
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
      clear2(addedNode, cache);
    }
    for (let j = 0; j < record.removedNodes.length; j++) {
      clear2(record.removedNodes[j], cache);
    }
    let node = record.target;
    if (node === _this) {
      invalid = true;
      continue;
    } else if (!_this.contains(node)) {
      clear2(node, cache);
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
function clear2(parent, cache) {
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
  var _a;
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
        cache.set(node, nodeInfo = new NodeInfo(0));
        if (isBlocklikeElement(node)) {
          nodeInfo.f |= IS_BLOCKLIKE;
        }
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
      if (nodeInfo.f & IS_OLD) {
        const expectedOffset = oldIndex - oldIndexRelative;
        const deleteLength = nodeInfo.offset - expectedOffset;
        if (deleteLength < 0) {
          throw new Error("cache offset error");
        } else if (deleteLength > 0) {
          oldIndex += deleteLength;
        }
      }
      nodeInfo.offset = offset;
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
      } else if (node.nodeName === "BR") {
        value += NEWLINE;
        offset += NEWLINE.length;
        hasNewline = true;
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else if (node !== _this && node.hasAttribute("data-content")) {
        const text = node.getAttribute("data-content") || "";
        if (text.length) {
          value += text;
          offset += text.length;
          hasNewline = text.endsWith(NEWLINE);
        }
        nodeInfo.beforeLength = 0;
        nodeInfo.afterLength = 0;
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else {
        const beforeText = node !== _this ? ((_a = node.getAttribute) == null ? void 0 : _a.call(node, "data-contentbefore")) || "" : "";
        descending = !!walker.firstChild();
        if (descending) {
          stack.push({ nodeInfo, oldIndexRelative });
          oldIndexRelative = oldIndex;
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.beforeLength;
          }
          nodeInfo.beforeLength = beforeText.length;
          offset = beforeText.length;
          if (beforeText.length) {
            value += beforeText;
            hasNewline = beforeText.endsWith(NEWLINE);
          }
        } else {
          if (beforeText.length) {
            value += beforeText;
            offset += beforeText.length;
            hasNewline = beforeText.endsWith(NEWLINE);
          }
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.beforeLength;
          }
          nodeInfo.beforeLength = beforeText.length;
        }
      }
    } else {
      if (!stack.length) {
        throw new Error("Stack is empty");
      }
      ({ nodeInfo, oldIndexRelative } = stack.pop());
      offset = nodeInfo.offset + offset;
    }
    if (!descending) {
      if (!(nodeInfo.f & IS_VALID)) {
        if (node !== _this && node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "BR" && !node.hasAttribute("data-content")) {
          const afterText = node.getAttribute("data-contentafter") || "";
          if (afterText.length) {
            value += afterText;
            offset += afterText.length;
            hasNewline = afterText.endsWith(NEWLINE);
          }
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.afterLength;
          }
          nodeInfo.afterLength = afterText.length;
        }
        if (nodeInfo.f & APPENDS_NEWLINE && node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("data-content")) {
          oldIndex += NEWLINE.length;
        }
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
      index = nodeInfo.length - nodeInfo.afterLength;
      if (nodeInfo.f & APPENDS_NEWLINE) {
        index -= NEWLINE.length;
      }
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
        index = nodeInfo.f & PREPENDS_NEWLINE ? -NEWLINE.length : 0;
      }
    }
  }
  for (; node !== _this; node = node.parentNode) {
    const nodeInfo = cache.get(node);
    index += nodeInfo.offset;
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
      if (node2.nodeType === Node.ELEMENT_NODE) {
        if (node2.hasAttribute("data-content")) {
          return nodeOffsetFromChild(node2, index > 0);
        }
        const ni = cache.get(node2);
        if (ni.beforeLength > 0) {
          if (index < ni.beforeLength) {
            return [node2, 0];
          }
          index -= ni.beforeLength;
        }
      }
      const firstChild = walker.firstChild();
      if (firstChild === null) {
        const offset = node2.nodeType === Node.TEXT_NODE ? index : Math.min(index > 0 ? 1 : 0, getNodeLength(node2));
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
export {
  ContentAreaElement,
  ContentEvent
};
