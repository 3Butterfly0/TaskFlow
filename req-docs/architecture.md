# TaskFlow – System Architecture & Implementation Guide

Version: 1.0
Stack: MERN (MongoDB, Express, React, Node.js)

---

# 1. System Overview

TaskFlow is a collaborative project management and issue-tracking platform combining:

* Kanban board workflow
* Ticketing system
* Real-time collaboration
* Role-based access control

Primary architectural goals:

* Scalable backend structure
* Real-time synchronization
* Clear separation of concerns
* Optimistic UI workflows
* Maintainable project structure

---

# 2. High-Level Architecture

## Components

Frontend:

* React (Vite)
* Redux Toolkit / RTK Query
* Socket.io client

Backend:

* Node.js
* Express
* Socket.io server
* MongoDB (Mongoose)

External Services:

* Cloudinary or AWS S3 (file storage)

---

## Request Flow

Typical API flow:

```
Client UI
 → RTK Query
 → Express Route
 → Controller
 → Mongoose Model
 → MongoDB
 → Response
```

Realtime flow:

```
Client Action
 → Socket Emit
 → Server Broadcast
 → Clients Update State
```

---

# 3. Backend Architecture

## Layered Structure

Recommended layering:

```
Route Layer
  → Middleware
  → Controller
  → Service (optional)
  → Model
```

Responsibilities:

Routes:

* HTTP mapping only

Controllers:

* Business logic
* Validation handling
* Response formatting

Services (optional but recommended):

* External APIs
* Upload logic
* Notification logic

Models:

* Schema definitions
* Indexing
* Query helpers

---

# 4. Database Design (Logical ER Model)

## Entities

User
Project
Task
Ticket
Comment (embedded)
Subtask (embedded)

---

## Relationships

User:

* Owns Projects
* Assigned to Tasks
* Reports Tickets
* Writes Comments

Project:

* Contains Tasks
* Contains Members
* Contains Columns (embedded ordering model)

Task:

* Belongs to Project
* Assigned to Users
* May originate from Ticket

Ticket:

* Reported by User
* Optionally linked to Task

---

## Cardinality

| Relationship   | Type                |
| -------------- | ------------------- |
| User → Project | One-to-Many         |
| Project → Task | One-to-Many         |
| Task → User    | Many-to-Many        |
| Ticket → Task  | Optional One-to-One |

---

# 5. Data Modeling Principles

## Column Ordering Strategy

Correct pattern:

```
columns: [
  {
    id: "uuid",
    title: "Todo",
    taskIds: []
  }
]
```

Rationale:

* Drag-and-drop libraries rely on stable identifiers
* Sorting via timestamps is unreliable for boards

---

## Optimistic UI Strategy

Workflow:

```
1. Update UI immediately
2. Send API request
3. On failure → rollback state
4. Show error toast
```

---

## Indexing Strategy

Recommended indexes:

Tasks:

```
projectId
columnId
assignees
priority
dueDate
```

Tickets:

```
reporter
status
severity
```

---

# 6. Backend Folder Structure (Production Grade)

```
server/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── passport.js
│   │   └── socket.js
│   │
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Project.model.js
│   │   ├── Task.model.js
│   │   └── Ticket.model.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   └── ticket.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   └── ticket.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── role.middleware.js
│   │
│   ├── services/
│   │   ├── upload.service.js
│   │   └── notification.service.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── logger.js
│   │
│   ├── app.js
│   └── server.js
│
└── package.json
```

---

# 7. Frontend Folder Structure (Scalable React)

```
client/
│
├── src/
│   ├── app/
│   │   ├── store.js
│   │   └── socket.js
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── tickets/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── modals/
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Board.jsx
│   │   └── Tickets.jsx
│   │
│   ├── hooks/
│   ├── routes/
│   ├── utils/
│   └── main.jsx
```

---

# 8. State Management Strategy

Use Redux Toolkit for:

* Auth state
* Projects
* Tasks
* Tickets
* API caching (RTK Query)

Use Context for:

* Theme
* Socket instance
* UI state

Guideline:

```
Server data → RTK Query
UI state → Local or Context
```

---

# 9. Socket Architecture

## Server Pattern

```
io.on("connection", socket => {
  socket.on("join-project", projectId => {
    socket.join(projectId)
  })
})
```

## Client Pattern

```
socket.emit("join-project", projectId)
socket.on("task-updated", handler)
```

---

## Room Strategy

Each project = one room

Benefits:

* Limits broadcast scope
* Scales better

---

# 10. Implementation Roadmap

## Phase 1: Backend Foundation

Implement:

* Express setup
* MongoDB connection
* User model
* JWT authentication
* Protected routes

Testing:

* Postman or Thunder Client

---

## Phase 2: Core Entities

Implement:

* Project CRUD
* Task CRUD
* Column ordering

Stabilize API before UI.

---

## Phase 3: Frontend Board

Build:

* Board UI
* Drag and drop
* Reorder API integration

---

## Phase 4: Ticketing

Implement:

* Ticket model
* Promote ticket to task
* Triage dashboard

---

## Phase 5: Realtime

Implement:

* Socket server
* Presence tracking
* Task movement events

---

# 11. Engineering Best Practices

Controllers:

* Use async/await
* Wrap in try/catch

Responses:

```
{ success: true, data }
{ success: false, error }
```

Validation:

* Zod or express-validator

Authentication:

* JWT in HttpOnly cookies

Uploads:

* Never store files in MongoDB

---

# 12. Common Pitfalls to Avoid

1. Business logic inside routes
2. No indexing strategy
3. Broadcasting sockets globally
4. Sorting tasks using timestamps
5. Deeply nested React state

---

# 13. Scalability Path (Future Architecture)

Possible upgrades:

```
API Gateway
Auth Service
Task Service
Notification Service
Redis (socket adapter)
ElasticSearch (search)
Queue (BullMQ)
```

Not required initially.

---

# 14. Recommended Build Order (Practical)

1. Auth system
2. Project CRUD
3. Task system
4. Board UI
5. Ticket workflow
6. Realtime updates
7. Notifications
8. File uploads

---

# 15. Design Principles

Key rules:

* Separate ordering from data
* Prefer embedding for small lists (subtasks)
* Prefer referencing for large collections (tasks, users)
* Keep API contracts stable before building UI
* Emit socket events only after DB success
