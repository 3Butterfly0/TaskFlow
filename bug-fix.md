# TaskFlow — Bug Fix Log

A running record of all bugs encountered during project development.
Each entry includes the bug title, description, root cause analysis, and the exact code change that resolved it.

---

## Bug #1: Task Duplicated Across All Board Columns

**Description:**
A single task when dragged across columns was duplicated and rendered in **all three columns** (Todo, In Progress, Done) on the Kanban board instead of rendering to only one column.

**Root Cause:**
Two interconnected issues in `BoardContainer.jsx`:

1. **`handleDragOver`** — This event fires **continuously** (every frame) during drag. It used `.indexOf()` + `.splice()` to remove the task from the source column, but didn't guard against the task already being absent from the source. On rapid re-fires, the task could end up inserted into the destination **multiple times** or into multiple columns, because the `findColumnByTaskId` helper used the `columns` reference from the `useCallback` closure which could be stale relative to the latest `setOptimisticColumns` update.

2. **`handleDragEnd`** — Tried to re-derive source/destination columns at drop time using a complex fallback chain (`actualSrcCol || srcCol`). When `actualSrcCol` was `undefined`, the fallback `srcCol` still contained the task ID in its `taskIds`. This sent the dragged task ID in **both** `newSourceTaskIds` and `newDestinationTaskIds` to the backend, permanently duplicating it in the database.

**Bug Causing Code:**

`client/src/features/board/BoardContainer.jsx` — `handleDragOver`

```jsx
const handleDragOver = useCallback(
  (event) => {
    // ...
    const activeColumn = findColumnByTaskId(activeId); // stale closure!
    // ...
    // Remove from source — .indexOf+.splice not idempotent
    const srcIdx = srcCol.taskIds.indexOf(activeId);
    if (srcIdx === -1) return prev;
    srcCol.taskIds.splice(srcIdx, 1);

    // Insert into destination — no duplicate check
    destCol.taskIds.push(activeId);
  },
  [columns, findColumnByTaskId, serverColumns], // depends on columns (changes every render)
);
```

`client/src/features/board/BoardContainer.jsx` — `handleDragEnd`

```jsx
const actualSrcCol = currentCols.find(
  (c) =>
    c.id !== actualDestCol?.id &&
    rollbackColumns.find((rc) => rc.id === c.id)?.taskIds?.includes(activeId),
);
const finalSrcCol = actualSrcCol || srcCol; // srcCol still has activeId!

await moveTask({
  newSourceTaskIds: finalSrcCol.taskIds || [], // still includes activeId
  newDestinationTaskIds: finalDestCol.taskIds || [], // also includes activeId
}).unwrap();
```

**Bug Fixed Code:**

`client/src/features/board/BoardContainer.jsx` — `handleDragStart` (new: capture origin in ref)

```jsx
const dragOriginRef = useRef(null);

const handleDragStart = useCallback(
  (event) => {
    const { active } = event;
    const task = taskMap[active.id];
    if (!task) return;
    setActiveTask(task);

    // Capture source from SERVER state — single source of truth
    const sourceCol = serverColumns.find((col) =>
      (col.taskIds || []).includes(active.id),
    );
    dragOriginRef.current = {
      taskId: active.id,
      sourceColumnId: sourceCol?.id || null,
      sourceTaskIds: sourceCol ? [...sourceCol.taskIds] : [],
    };
  },
  [taskMap, serverColumns],
);
```

`client/src/features/board/BoardContainer.jsx` — `handleDragOver` (fixed: filter-based, idempotent)

```jsx
const handleDragOver = useCallback(
  (event) => {
    // ...
    setOptimisticColumns((prev) => {
      const currentCols = prev || serverColumns;
      // Find active column from CURRENT optimistic state (inside setter)
      const activeColumn = currentCols.find((c) =>
        (c.taskIds || []).includes(activeId),
      );
      // ...
      // Use .filter() — idempotent, safe on repeated calls
      srcCol.taskIds = srcCol.taskIds.filter((id) => id !== activeId);
      destCol.taskIds = destCol.taskIds.filter((id) => id !== activeId);
      // Then insert once
      destCol.taskIds.splice(overIdx, 0, activeId);
      return cols;
    });
  },
  [serverColumns], // depends only on serverColumns (stable)
);
```

`client/src/features/board/BoardContainer.jsx` — `handleDragEnd` (fixed: uses dragOriginRef)

```jsx
const handleDragEnd = useCallback(
  async (event) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    // ...
    // Source = ref captured at drag start (immutable)
    const newSourceTaskIds = origin.sourceTaskIds.filter(
      (id) => id !== activeId,
    );

    // Destination = where optimistic state placed it
    const currentColumn = currentCols.find((c) =>
      (c.taskIds || []).includes(activeId),
    );

    await moveTask({
      sourceColumnId: origin.sourceColumnId,
      destinationColumnId: currentColumn.id,
      newSourceTaskIds,
      newDestinationTaskIds: newDestTaskIds,
    }).unwrap();
  },
  [optimisticColumns, serverColumns, projectId, reorderColumn, moveTask],
);
```

**Key Changes:**

1. **`dragOriginRef`** — Captures source column ID and its original `taskIds` at drag start (from server state). This ref is the single source of truth for where the task came from — it never changes during the drag.
2. **Idempotent `handleDragOver`** — Uses `.filter()` instead of `.indexOf()` + `.splice()` to remove the task from columns. Removes from destination before inserting, preventing duplicates on repeated fires.
3. **Closure-safe** — `handleDragOver` reads from `prev` inside the `setOptimisticColumns` callback, avoiding stale closure reads of `columns`.
4. **Clean `handleDragEnd`** — Uses `dragOriginRef.current.sourceTaskIds.filter()` to build source array (guaranteed no active task ID). No complex fallback chains.

**Additional Fix:**
A database cleanup script was run to reconcile each column's `taskIds` array against the actual `task.columnId` values, removing stale duplicate entries.

---
