# TaskFlow – Production Blueprint

Version: 1.0
Scope: Data Modeling, Board Mechanics, Performance, and Real-World Engineering Patterns

---

# 1. Objective

This document defines:

* Production-grade schema strategies
* Board modeling patterns used in real Kanban systems
* Reordering algorithms
* Permission modeling
* Performance and scaling considerations
* Deployment architecture

This document assumes the base architecture is already defined.

---

# 2. Real-World Board Modeling (How Jira/Trello Do It)

A Kanban board is fundamentally:

```
Board
  → Columns
      → Ordered Task References
```

Key principle:

**Order is not derived from timestamps.
Order is stored explicitly.**

---

## Correct Data Pattern

Project:

```
columns: [
  {
    id: "column_uuid",
    title: "Todo",
    taskIds: ["task1", "task5", "task8"]
  }
]
```

Tasks are stored separately:

```
Task {
  _id,
  title,
  projectId,
  columnId
}
```

This allows:

* Fast board rendering
* Predictable ordering
* Efficient drag and drop

---

# 3. Why Order Must Be Separate from Tasks

Incorrect design:

```
tasks sorted by createdAt
```

Problems:

* Reordering becomes expensive
* Requires rewriting timestamps
* Race conditions in realtime systems

Correct design:

```
Column maintains task order
```

This is O(1) read complexity.

---

# 4. Production-Grade Mongoose Schema Improvements

## User Schema Enhancements

Add:

```
lastSeen
isOnline
workspaceIds
```

Index:

```
email: unique
googleId: sparse
```

---

## Project Schema Improvements

Add:

```
createdBy
archived
visibility
```

Index:

```
owner
members
```

---

## Task Schema Improvements

Add:

```
position
labels
watchers
activityLog
```

Indexes:

```
projectId
columnId
assignees
dueDate
priority
```

Compound index:

```
{ projectId: 1, columnId: 1 }
```

This accelerates board rendering.

---

## Ticket Schema Improvements

Add:

```
attachments
triagedBy
resolvedAt
```

Indexes:

```
status
reporter
severity
```

---

# 5. Activity Log Pattern (Important for Audit Trails)

Do NOT store activity as plain text only.

Use structured events:

```
activityLog: [
  {
    type: "priority_changed",
    actorId,
    metadata: {
      from: "medium",
      to: "high"
    },
    createdAt
  }
]
```

Benefits:

* Easy UI formatting
* Analytics support
* Future automation

---

# 6. Reorder Algorithm (Production Pattern)

Reordering happens in two scenarios:

1. Reorder inside column
2. Move across columns

---

## Reorder Inside Column

Client sends:

```
{
  columnId,
  taskIds: ["task3", "task1", "task5"]
}
```

Server:

```
Update column.taskIds
```

No task updates required.

---

## Move Across Columns

Client sends:

```
{
  sourceColumnId,
  destinationColumnId,
  taskId,
  newSourceTaskIds,
  newDestinationTaskIds
}
```

Server steps:

1. Update source column
2. Update destination column
3. Update task.columnId
4. Emit socket event

All inside transaction.

---

# 7. MongoDB Transactions (Important)

Use transactions when:

* Moving tasks
* Promoting tickets
* Multi-document writes

Pattern:

```
session.startTransaction()
try {
  updateColumnA()
  updateColumnB()
  updateTask()
  commitTransaction()
} catch {
  abortTransaction()
}
```

---

# 8. Permission System Design (RBAC)

Do NOT hardcode permissions.

Use role middleware.

---

## Role Matrix

| Action         | Admin | Member | Observer |
| -------------- | ----- | ------ | -------- |
| Create Task    | Yes   | Yes    | No       |
| Move Task      | Yes   | Yes    | No       |
| Comment        | Yes   | Yes    | Yes      |
| Raise Ticket   | Yes   | Yes    | Yes      |
| Delete Project | Yes   | No     | No       |

---

## Middleware Pattern

```
authorizeRoles("admin", "member")
```

---

# 9. Presence System (Realtime Online Users)

Do NOT store online status permanently.

Use socket tracking.

---

## Server Pattern

Maintain:

```
Map<userId, socketId>
```

On connect:

```
mark online
broadcast presence
```

On disconnect:

```
mark offline
broadcast presence
```

---

# 10. Notification Architecture (Scalable)

Do not store notifications only in sockets.

Use DB storage:

```
Notification {
  userId,
  type,
  entityId,
  isRead,
  createdAt
}
```

Socket only pushes:

```
"new-notification"
```

---

# 11. Performance Optimization Strategy

Critical improvements:

### Pagination

Tasks:

```
limit + cursor
```

### Lazy Loading

Load:

* Comments on demand
* Activity logs on demand

### Caching

Use:

* Redis (future)
* RTK Query caching

---

# 12. File Upload Architecture

Correct pipeline:

```
Client → Express → Multer → Cloudinary/S3 → Save URL in DB
```

Never:

```
Store binary in MongoDB
```

---

# 13. Search Strategy (Future)

Add:

```
title text index
description text index
```

Later upgrade:

ElasticSearch or Meilisearch

---

# 14. Socket Event Design

Use domain-driven events.

Examples:

```
task.created
task.updated
task.moved
comment.added
ticket.promoted
```

Avoid generic events like:

```
updateData
```

---

# 15. Error Handling Standard

Always return:

```
{
  success: false,
  error: {
    message,
    code
  }
}
```

Never leak stack traces.

---

# 16. Logging Strategy

Use:

```
winston or pino
```

Log:

* Errors
* Auth failures
* DB failures

Do not log:

* Passwords
* Tokens

---

# 17. Deployment Architecture (Production)

Minimum production setup:

```
Frontend → CDN (Vercel / Netlify)
Backend → Node server (Render / Railway / AWS)
Database → MongoDB Atlas
Storage → Cloudinary
```

---

# 18. Environment Variables

Backend:

```
MONGO_URI
JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDINARY_KEY
```

Never commit `.env`.

---

# 19. Testing Strategy

Minimum:

* Controller tests
* Auth tests
* API contract tests

Tools:

```
Jest
Supertest
```

---

# 20. Engineering Principles

Follow:

1. Controllers thin, services reusable
2. Index frequently queried fields
3. Use transactions for multi-writes
4. Emit socket events after DB success
5. Validate inputs strictly

---

# 21. Realistic Development Timeline

Week 1:
Auth + Users

Week 2:
Projects + Tasks

Week 3:
Board UI + DnD

Week 4:
Tickets + Realtime

Week 5:
Polish + Uploads + Notifications
