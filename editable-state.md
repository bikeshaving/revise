# Revise Crank Wrapper Design Decisions

## The Core Problem

The Crank.js playground's code editor currently requires **over 400 lines** of
complex integration code that includes:
- Manual state coordination between value, edit history, and selection
- Intricate "source" tracking to distinguish between user edits, programmatic
  changes, and internal renders
- Complex DOM event interception (preventDefault, stopImmediatePropagation,
  re-sourcing null events)
- Bidirectional syncing between high-level state and low-level
  ContentAreaElement

This reveals a fundamental gap between Revise's low-level DOM events and the
clean API needed for framework integration.

## Two-Layer Architecture Solution

### Layer 1: EditableState (Framework-Agnostic Core)

**Location:** `@b9g/revise/state.js`

**Purpose:** A stateful coordinator that manages all editing concerns through a
unified callback pipeline.

**Key Design Decisions:**

1. **Everything Baked In, Not Optional**
  - EditableState is an EventTarget with history, keyer, and selection
    management built-in
  - No manual configuration of optional features
  - Single source of truth for all editing state

2. **Unified Callback Pipeline**
  - All edits flow through a single transformation function
  - Callback receives current state and returns new state
  - Enables intercepting/transforming edits (e.g., paste sanitization,
    collaborative OT)

3. **State Management**
   ```typescript
class EditableState extends EventTarget {
  // Managed state
  value: string
  history: EditHistory
  keyer: Keyer
  selection: SelectionRange

  // Unified callback
  constructor(initialValue: string, onEdit: (state) => newState)
}
   ```

4. **NOT an onChange API**
   - The key insight: we need state management, not just callbacks
   - onChange APIs don't solve the source tracking problem
   - EditableState coordinates multiple concerns that interact

### Layer 2: Editable Component (Crank Wrapper)

**Location:** `@b9g/crank-editable/index.ts`

To kebab-case? Or not to kebab-case?

**Purpose:** Bridge the high-level EditableState API to the low-level ContentAreaElement DOM interface.

**Key Design Decisions:**

1. **"Thin" Wrapper Definition**
  - Thinness measured by how well it bridges abstraction levels
  - Handles complex DOM event interception automatically
  - Bridges contentchange events to EditableState method calls
  - Manages programmatic render sourcing
  - Syncs selection state bidirectionally

2. **Component Responsibilities**
  - DOM event interception and re-sourcing
  - Preventing default browser behaviors
  - Converting contentchange events to EditableState updates
  - Providing context to child components
  - Managing ContentAreaElement lifecycle

3. **NOT Just a Simple Wrapper**
  - The complexity is essential, not accidental
  - Must handle the impedance mismatch between:
    - Synchronous DOM requirements
    - Framework render lifecycles
    - User input vs programmatic changes

## Critical Use Cases Driving Design

1. **Collaborative Editing with Operational Transforms**
  - Need to intercept edits before they're applied
  - Transform through OT algorithm
  - Apply transformed edit to EditableState

2. **Programmatic Operations**
  - Can reset Editable surface and state
  - Preserve or reset history appropriately
  - Handle selection state correctly
  - Automatic keying

3. **Custom Edit Transformations**
  - Paste sanitization (strip formatting, validate content)
  - Auto-formatting (markdown shortcuts, auto-indentation)
  - Input validation (character limits, allowed patterns)
  - Other translation of DOM events to Edits.

4. **Bidirectional Editing (Playground Scenario)**
  - Input and output editors affect each other
  - Need clear distinction between user edits and programmatic updates
  - Must avoid infinite update loops

## API Design

### Package Structure

```typescript
// @b9g/revise/state.js (NEW)
export class EditableState extends EventTarget {
  constructor(initialValue: string, onEdit: (state) => newState)
  value: string
  history: EditHistory
  keyer: Keyer
  selection: SelectionRange
}

// @b9g/crank-editable/index.ts
export function* Editable(props) { /* ... */ }
// Usage
state.addEventListener("change", () => {
  this.refresh();
});
yield (
  <Editable state={state}>
    <Lines state={state} />
  </Editable>
);

export {EditableState} from "@b9g/revise/state.js"
export function useEditableState(context: Context): EditableState
export function useKeyer(context: Context): Keyer
```

### Usage Pattern

```typescript
import {Editable, EditableState, useKeyer} from "@b9g/crank-editable";

function* Editor() {
  // Create EditableState with transformation callback
  const state = new EditableState("", ({value, edit}) => {
    // Intercept and transform edits here
    // For collaborative editing, apply OT here
    // For paste sanitization, modify edit here
    return {value: transformedValue};
  });

  yield (
    <Editable state={state}>
      <MyContent />
    </Editable>
  );
}

function* MyContent() {
  const keyer = useKeyer(this);
  const state = useEditableState(this);
  // Access editing context through hooks
}
```

## Why NOT onChange API

The conversation explored and rejected simple onChange APIs like:

```typescript
// ❌ Rejected: Too simple, doesn't solve the real problems
<Editable
  value={value}
  onChange={(newValue) => setValue(newValue)}
/>
```

**Problems with onChange approach:**
1. Doesn't handle source tracking (user edit vs programmatic change)
2. No unified place to intercept/transform edits
3. History, keyer, selection management left to consumer
4. Loses the edit operation itself (needed for OT, undo/redo)
5. Forces every consumer to rebuild the same coordination logic

**EditableState solves these by:**
- Being a stateful coordinator, not just a callback
- Providing a single transformation point for all edits
- Managing all related concerns (history, keys, selection) together
- Exposing the Edit object for advanced use cases

## Implementation Strategy

### Current State (Gaps)
- Playground code-editor.ts has all the logic but it's tangled
- Manual coordination between value, history, keyer, selection
- Complex source tracking to avoid infinite loops
- Event handling spread across multiple methods

### Target State (After Implementation)
1. EditableState class extracted to @b9g/revise
2. Editable component simplified to ~100 lines (from 400+)
3. Clear separation between framework-agnostic (EditableState) and Crank-specific (Editable)
4. Playground refactored to use new library (validates API)

### Next Steps for Claude Code

1. **Extract EditableState from playground implementation**
   - Identify stateful coordination logic in code-editor.ts
   - Design the unified callback API based on actual usage patterns
   - Move to @b9g/revise/state.js

2. **Build Editable wrapper component**
   - Handle DOM event interception
   - Bridge to EditableState methods
   - Provide context for hooks
   - Target: ~100 lines of focused bridging code

3. **Refactor playground to validate**
   - Should reduce code-editor.ts significantly
   - Proves the API works for real use case
   - Identifies any missing functionality
