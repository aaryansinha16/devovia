# Devovia Platform - Feature Hierarchy & Flow Documentation

## 📋 Table of Contents
1. [Platform Overview](#platform-overview)
2. [Feature Hierarchy](#feature-hierarchy)
3. [User Flows](#user-flows)
4. [Collaborative Features](#collaborative-features)
5. [Data Relationships](#data-relationships)

---

## 🎯 Platform Overview

Devovia is a comprehensive developer platform that provides tools for code execution, collaboration, content management, and project organization.

### Core Pillars
1. **Execution & Development** - Sessions, Runbooks
2. **Content & Knowledge** - Blogs, Snippets, Projects
3. **Collaboration** - Team features, Collaborative Sessions
4. **Management** - Analytics, Settings, Deployments

---

## 🏗️ Feature Hierarchy

```
DEVOVIA PLATFORM
│
├── 👤 USER ACCOUNT
│   ├── Authentication (JWT-based)
│   ├── Profile Management
│   ├── Role System (USER, ADMIN, MODERATOR)
│   └── Settings & Preferences
│
├── 🖥️ SESSIONS (Code Execution)
│   ├── Individual Sessions
│   │   ├── Create Session
│   │   ├── Execute Code
│   │   ├── Session History
│   │   └── Session Management
│   │
│   └── Collaborative Sessions
│       ├── Create Collaborative Session
│       ├── Invite Team Members
│       ├── Real-time Code Sharing
│       ├── WebSocket Communication
│       └── Session Permissions (Owner, Editor, Viewer)
│
├── 📖 RUNBOOKS (Automated Workflows)
│   ├── Runbook Creation
│   ├── Step Management
│   ├── Execution & Scheduling
│   ├── Approval Workflows
│   └── Secret Management
│
├── 📝 BLOGS (Content Management)
│   ├── Blog Posts
│   │   ├── Create/Edit/Delete
│   │   ├── Markdown Support
│   │   ├── Image Upload
│   │   ├── Tags & Categories
│   │   └── Publish/Draft Status
│   │
│   ├── Comments System
│   │   ├── Nested Comments
│   │   ├── User Mentions
│   │   └── Comment Moderation
│   │
│   └── Engagement
│       ├── Likes
│       ├── Views Counter
│       └── Social Sharing
│
├── 💻 CODE SNIPPETS
│   ├── Snippet Management
│   │   ├── Create/Edit/Delete
│   │   ├── Language Support (Monaco Editor)
│   │   ├── Syntax Highlighting
│   │   └── Code Formatting
│   │
│   ├── Organization
│   │   ├── Tags
│   │   ├── Language Filter
│   │   └── Search
│   │
│   └── Visibility
│       ├── Public Snippets
│       └── Private Snippets
│
├── 💼 PROJECTS (Portfolio Management)
│   ├── Project Management
│   │   ├── Create/Edit/Delete
│   │   ├── Project Details
│   │   │   ├── Title & Description
│   │   │   ├── Thumbnail
│   │   │   ├── Tech Stack
│   │   │   ├── Repository URL
│   │   │   ├── Demo URL
│   │   │   └── Start/End Dates
│   │   │
│   │   ├── Status Tracking
│   │   │   ├── Planning
│   │   │   ├── In Progress
│   │   │   ├── Completed
│   │   │   ├── On Hold
│   │   │   └── Archived
│   │   │
│   │   └── Visibility Control
│   │       ├── Public
│   │       ├── Private
│   │       └── Team Only
│   │
│   ├── Team Management
│   │   ├── Project Owner
│   │   ├── Team Members
│   │   ├── Role Assignment
│   │   │   ├── Owner (Full Control)
│   │   │   ├── Admin (Manage Team & Content)
│   │   │   ├── Member (Edit Content)
│   │   │   └── Viewer (Read Only)
│   │   │
│   │   └── Member Operations
│   │       ├── Add Member
│   │       ├── Update Role
│   │       └── Remove Member
│   │
│   └── Links System
│       ├── Add Project Links
│       ├── Link Types
│       │   ├── Documentation
│       │   ├── Design
│       │   ├── Deployment
│       │   ├── Repository
│       │   └── Other
│       │
│       └── Link Management
│           ├── Edit Link
│           └── Delete Link
│
├── 📦 TEMPLATES (Project Templates)
│   ├── Template Library
│   ├── Template Creation
│   └── Template Usage
│
├── 🚀 DEPLOYMENTS
│   ├── Deployment Management
│   ├── Environment Configuration
│   └── Deployment History
│
├── 👥 TEAM COLLABORATION
│   ├── Team Management
│   ├── Member Invitations
│   └── Team Permissions
│
└── 📊 ANALYTICS
    ├── Usage Statistics
    ├── Performance Metrics
    └── Activity Tracking
```

---

## 🔄 User Flows

### 1. Session Flow (Code Execution)

```
User Login
    ↓
Dashboard → Sessions
    ↓
Create New Session
    ↓
Configure Environment
    ↓
Write/Execute Code
    ↓
View Results
    ↓
Save/Share Session
```

### 2. Collaborative Session Flow

```
User (Owner)
    ↓
Create Collaborative Session
    ↓
Set Permissions
    ↓
Invite Team Members (via email/username)
    ↓
Share Session Link
    ↓
    ├─→ Team Member Joins
    │       ↓
    │   Real-time Code Collaboration
    │       ↓
    │   Execute Code Together
    │       ↓
    │   View Shared Results
    │
    └─→ WebSocket Connection
            ↓
        Live Updates
```

### 3. Blog Post Flow

```
User Login
    ↓
Dashboard → Blogs
    ↓
Create New Post
    ↓
Write Content (Markdown)
    ↓
Add Images/Media
    ↓
Add Tags
    ↓
Set Status (Draft/Published)
    ↓
Publish
    ↓
    ├─→ Readers View Post
    │       ↓
    │   Like/Comment
    │       ↓
    │   Share
    │
    └─→ Author Analytics
            ↓
        Views/Engagement
```

### 4. Code Snippet Flow

```
User Login
    ↓
Dashboard → Snippets
    ↓
Create New Snippet
    ↓
Write Code (Monaco Editor)
    ↓
Select Language
    ↓
Add Tags
    ↓
Set Visibility (Public/Private)
    ↓
Save Snippet
    ↓
    ├─→ Search/Filter Snippets
    │       ↓
    │   View Snippet
    │       ↓
    │   Copy/Edit
    │
    └─→ Share Public Snippets
```

### 5. Project Management Flow

```
User Login
    ↓
Dashboard → Projects
    ↓
Create New Project
    ↓
Add Project Details
    │   ├─ Title & Description
    │   ├─ Tech Stack
    │   ├─ URLs (Repo, Demo)
    │   ├─ Thumbnail
    │   └─ Dates
    ↓
Set Status & Visibility
    ↓
Save Project
    ↓
    ├─→ Add Team Members
    │       ↓
    │   Assign Roles
    │       ↓
    │   Collaborate on Project
    │
    ├─→ Add Project Links
    │       ↓
    │   Documentation
    │   Design Files
    │   Deployment URLs
    │
    └─→ Update Project Status
            ↓
        Track Progress
```

### 6. Runbook Flow

```
User Login
    ↓
Dashboard → Runbooks
    ↓
Create New Runbook
    ↓
Add Steps
    ↓
Configure Secrets
    ↓
Set Approval Requirements
    ↓
Schedule Execution (Optional)
    ↓
Execute Runbook
    ↓
View Results & Logs
```

---

## 🤝 Collaborative Features

### Current Collaborative Capabilities

#### ✅ **Collaborative Sessions** (Fully Implemented)
- **Real-time code collaboration**
- **WebSocket-based communication**
- **Role-based permissions:**
  - Owner: Full control
  - Editor: Can edit code
  - Viewer: Read-only access
- **Live cursor tracking**
- **Shared execution results**
- **Session history**

#### ✅ **Projects Team Management** (Newly Implemented)
- **Multi-user project teams**
- **Role-based access:**
  - Owner: Full control, can delete project
  - Admin: Manage team, edit content
  - Member: Edit project content
  - Viewer: Read-only access
- **Team member operations:**
  - Add/remove members
  - Update member roles
  - View team list
- **Visibility control:**
  - Public: Anyone can view
  - Private: Only owner can view
  - Team Only: Only team members can view

#### ✅ **Blog Comments** (Implemented)
- **Public commenting system**
- **Nested comment threads**
- **User mentions**
- **Comment moderation**

### Potential Collaborative Enhancements

#### 🔮 **Future: Collaborative Snippets**
**Concept:** Allow teams to collaborate on code snippets

**Proposed Features:**
- **Shared Snippet Collections**
  - Team-owned snippet libraries
  - Shared tags and organization
  - Version history
  
- **Collaborative Editing**
  - Real-time snippet editing (similar to Collaborative Sessions)
  - Comment on snippets
  - Suggest improvements
  
- **Team Permissions**
  - Owner: Full control
  - Editor: Can edit snippets
  - Viewer: Read-only access

**Implementation Path:**
1. Add `SnippetTeam` model (similar to `ProjectMember`)
2. Add team management endpoints
3. Implement real-time editing with WebSocket
4. Add permission checks to snippet controllers

#### 🔮 **Future: Collaborative Runbooks**
**Concept:** Team-based runbook creation and execution

**Proposed Features:**
- **Team Runbooks**
  - Shared runbook libraries
  - Team approval workflows
  - Collaborative step creation
  
- **Execution Permissions**
  - Owner: Full control
  - Approver: Can approve executions
  - Executor: Can execute approved runbooks
  - Viewer: Read-only access

**Implementation Path:**
1. Add `RunbookTeam` model
2. Enhance approval system for team workflows
3. Add team-based secret management
4. Implement team execution logs

#### 🔮 **Future: Collaborative Blogs**
**Concept:** Multi-author blog posts and team blogs

**Proposed Features:**
- **Co-authoring**
  - Multiple authors per post
  - Author contributions tracking
  - Collaborative editing
  
- **Team Blogs**
  - Organization/team blog spaces
  - Editorial workflows
  - Content approval process

**Implementation Path:**
1. Add `BlogTeam` or `PostCoAuthor` model
2. Implement editorial workflow
3. Add team blog spaces
4. Version control for posts

---

## 🔗 Data Relationships

### Entity Relationship Overview

```
USER
  ├─── owns → SESSIONS
  ├─── owns → COLLABORATIVE_SESSIONS
  ├─── participates in → COLLABORATIVE_SESSIONS (via SessionPermission)
  ├─── owns → RUNBOOKS
  ├─── owns → BLOG_POSTS
  ├─── writes → COMMENTS
  ├─── gives → LIKES
  ├─── owns → SNIPPETS
  ├─── owns → PROJECTS
  └─── member of → PROJECTS (via ProjectMember)

PROJECT
  ├─── has many → PROJECT_MEMBERS
  ├─── has many → PROJECT_LINKS
  ├─── has many → COMMENTS
  └─── has many → LIKES

COLLABORATIVE_SESSION
  ├─── has many → SESSION_PERMISSIONS
  └─── belongs to → USER (owner)

BLOG_POST
  ├─── has many → COMMENTS
  ├─── has many → LIKES
  └─── belongs to → USER (author)

SNIPPET
  └─── belongs to → USER (owner)

RUNBOOK
  ├─── has many → RUNBOOK_STEPS
  ├─── has many → RUNBOOK_SECRETS
  ├─── has many → RUNBOOK_SCHEDULES
  └─── belongs to → USER (owner)
```

### Permission Models

#### Project Permissions
```
PROJECT_MEMBER
  ├─── projectId (FK → Project)
  ├─── userId (FK → User)
  └─── role: OWNER | ADMIN | MEMBER | VIEWER
```

#### Collaborative Session Permissions
```
SESSION_PERMISSION
  ├─── sessionId (FK → CollaborativeSession)
  ├─── userId (FK → User)
  └─── permission: OWNER | EDITOR | VIEWER
```

---

## 🎯 Answering Your Questions

### Q: Can a team of 5 people start a collaborative session?

**Yes! ✅** The Collaborative Sessions feature fully supports this:

1. **Owner creates a collaborative session**
2. **Owner invites 4 team members** (via email or username)
3. **All 5 people can:**
   - Join the same session
   - See each other's code in real-time
   - Execute code together
   - View shared results
   - Communicate via the session

**Current Implementation:**
- Located at: `/dashboard/sessions`
- WebSocket-based real-time collaboration
- Role-based permissions (Owner, Editor, Viewer)
- Session history and management

### Q: Can teams collaborate on Snippets and other features?

**Current State:**
- **Projects: YES ✅** - Full team collaboration with roles
- **Snippets: NO ❌** - Currently individual-only
- **Blogs: PARTIAL 🟡** - Comments system only
- **Runbooks: NO ❌** - Currently individual-only

**Recommendation for Enhancement:**
To enable team collaboration on Snippets and Runbooks, follow the same pattern used in Projects:

1. **Add Team Models** (e.g., `SnippetMember`, `RunbookTeam`)
2. **Implement Role-Based Permissions**
3. **Add Team Management UI**
4. **Optional: Add Real-time Editing** (like Collaborative Sessions)

The architecture is already proven with Projects and Collaborative Sessions, so extending it to other features would be straightforward!

---

## 📝 Notes

- All features use JWT authentication
- Database: PostgreSQL with Prisma ORM
- Real-time features: WebSocket (Socket.io)
- Frontend: Next.js 15 with React
- Backend: Express.js (Port 4000)
- Frontend: Next.js (Port 3000)

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
