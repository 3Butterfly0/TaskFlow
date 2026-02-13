# Product Requirement Document: TaskFlow (MERN Edition)

**Version:** 2.0
**Stack:** MongoDB, Express.js, React, Node.js
**Type:** Collaborative Project Management & Issue Tracking System

---

# 1. Executive Summary

TaskFlow is a modern, real-time collaboration platform that unifies project management (Kanban) with issue tracking (Ticketing). It is designed to help cross-functional teams—Developers, Designers, and Stakeholders—work together seamlessly.

## Core Value Proposition

* **Unified Workflow:** Manage tasks on a board and accept external tickets in one place.
* **Real-Time Sync:** See teammates move cards and type comments instantly.
* **Role-Based Access:** Granular control over who can edit boards vs. who can only raise tickets.

---

# 2. Tech Stack Specifications

## Frontend

* **Core:** React (Vite), JavaScript / TypeScript
* **State Management:**

  * Redux Toolkit (Global Server State & Auth)
  * Context API (Theme / UI State)
* **Styling:** Tailwind CSS + Headless UI
* **Drag & Drop:** @dnd-kit/core
* **Real-Time Client:** socket.io-client
* **Rich Text Editor:** tiptap or react-quill

## Backend

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas with Mongoose ODM
* **Auth:** jsonwebtoken (JWT) + passport (Google OAuth strategy)
* **Validation:** zod or express-validator
* **Real-Time Server:** socket.io
* **File Storage:** Cloudinary or AWS S3 (via multer)

---

# 3. Functional Requirements

## 3.1 Authentication & User Identity

### Email / Password Login

* Secure authentication using bcrypt hashing
* HttpOnly JWT cookies

### Google OAuth

* Sign up / Login with Google
* Implement using `passport-google-oauth20`
* Exchange Google profile for a JWT

### User Profile

* Avatar upload (drag & drop)
* Online status indicator (green dot when socket connected)

---

## 3.2 Workspace & Role Management (RBAC)

### Workspaces

Top-level container (example: *Acme Corp*)

### Roles

**Admin**

* Full access
* Billing
* User management

**Member**

* Create/edit tasks
* Move cards

**Observer (Client)**

* Read-only access to specific boards
* Can comment and raise tickets

---

## 3.3 Ticketing System (Service Desk)

### Feature

Dedicated **Help Desk** view separate from project boards.

### Workflow

1. Observer clicks **Raise Issue**
2. Fill form:

   * Subject
   * Description
   * Severity
   * Screenshots
3. Ticket lands in **Triage list**
4. Admin/Member can **Promote to Task**

---

## 3.4 Advanced Kanban Board

### Columns

* Create
* Rename
* Delete
* Reorder

### Drag and Drop

* Move tasks between columns
* Reorder tasks within column

### Optimistic UI

* Card snaps instantly
* Rollback on API failure with error toast

### Filtering

* By Assignee ("My Tasks")
* By Priority
* By Labels

---

## 3.5 Task Details (Card)

* Rich descriptions (bold, lists, code blocks)
* Subtasks with progress bar
* Attachments (images, PDFs)
* Activity log (audit trail)
* Threaded comments with @mentions

---

## 3.6 Real-Time Collaboration

* Live board updates via Socket.io
* Presence awareness (who is viewing a card)
* In-app notifications (mentions, assignments)

---

# 4. Database Schema (Mongoose Models)

## User

```js
{
  username: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, select: false },
  googleId: { type: String },
  avatar: String,
  role: { type: String, enum: ['admin', 'member', 'observer'], default: 'member' }
}
```

## Project

```js
{
  name: String,
  description: String,
  owner: { type: ObjectId, ref: 'User' },
  members: [{ type: ObjectId, ref: 'User' }],
  columns: [{
    title: String,
    id: String,
    taskIds: [String]
  }]
}
```

## Task

```js
{
  title: String,
  content: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  projectId: { type: ObjectId, ref: 'Project' },
  columnId: String,
  assignees: [{ type: ObjectId, ref: 'User' }],
  attachments: [{ url: String, filename: String }],
  subtasks: [{ title: String, isCompleted: Boolean }],
  dueDate: Date,
  comments: [{
    text: String,
    user: { type: ObjectId, ref: 'User' },
    createdAt: Date
  }]
}
```

## Ticket

```js
{
  subject: String,
  description: String,
  severity: { type: String, enum: ['minor', 'major', 'blocking'] },
  reporter: { type: ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'] },
  linkedTaskId: { type: ObjectId, ref: 'Task' }
}
```

---

# 5. API Endpoints (REST)

## Auth Routes

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/google
GET  /api/auth/google/callback
POST /api/auth/logout
```

## Project Routes

```
GET  /api/projects
POST /api/projects
GET  /api/projects/:id
PUT  /api/projects/:id/reorder
```

## Task Routes

```
POST  /api/tasks
PATCH /api/tasks/:id
POST  /api/tasks/:id/comments
```

## Ticket Routes

```
POST /api/tickets
GET  /api/tickets
POST /api/tickets/:id/promote
```

---

# 6. Milestones (Vertical Slices)

## Phase 1: Foundation & Auth

* Setup Monorepo (Client/Server)
* Implement Passport.js for Google OAuth & Local Strategy
* Create Protected Route wrapper in React

## Phase 2: Core Project Management

* Project CRUD
* Kanban Board UI
* Integrate DnD (Frontend first)
* Connect reorder API

## Phase 3: Ticket Workflow

* Raise Issue modal
* Triage dashboard
* Promote Ticket to Task

## Phase 4: Real-Time & Polish

* Socket.io server
* Emit task events
* UI polish (skeletons, toasts)

---