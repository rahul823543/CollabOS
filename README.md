<div align="center">

<br/>

```
   ██████╗ ██████╗ ██╗     ██╗      █████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██║     ██║     ██╔══██╗██╔══██╗██╔═══██╗██╔════╝
  ██║     ██║   ██║██║     ██║     ███████║██████╔╝██║   ██║███████╗
  ██║     ██║   ██║██║     ██║     ██╔══██║██╔══██╗██║   ██║╚════██║
  ╚██████╗╚██████╔╝███████╗███████╗██║  ██║██████╔╝╚██████╔╝███████║
   ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝
```

### AI-Powered Collaboration Operating System

**Stop juggling ten tools. CollabOS connects them all.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-collab--os--frontend.vercel.app-black?style=for-the-badge)](https://collab-os-frontend.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

> 🌐 **Try it live →** [collab-os-frontend.vercel.app](https://collab-os-frontend.vercel.app/)

</div>

---

## 📖 What is CollabOS?

CollabOS is a **production-grade, full-stack collaboration platform** built for modern dev teams. It's not just a project manager — it's the intelligence layer that sits between your team, your code, and your tools.

- 🤖 Let **Gemini AI** plan your entire project from a single description
- 🔴 See which teammates are **online in real-time** via Socket.io presence
- 🔗 Sync **GitHub commits** directly into your project timeline
- 📁 Link **Google Drive folders & Docs** to any project
- 📊 Visualize **contribution analytics** per developer, per project

One system. Zero context-switching.

---

## ✨ Feature Highlights

| Feature | Description |
|---|---|
| 🔐 **JWT Auth** | Secure registration & login with bcrypt password hashing |
| 🔑 **Google OAuth** | One-click sign-in with your Google account |
| 🟢 **Live Presence** | Real-time "who's online" powered by Socket.io |
| 👥 **Team Management** | Create teams, manage members, assign roles |
| 📁 **Project Planning** | Create projects manually or let AI do it |
| 🤖 **AI Task Generation** | Gemini AI auto-generates tasks from your project description |
| 🔗 **GitHub Integration** | Connect repo, sync commits, track per-user contributions |
| 📄 **Google Workspace** | Link Drive folders, access Docs — per project |
| 📊 **Contribution Analytics** | Per-user, per-project breakdown of commits & activity |
| 🛡️ **Rate Limiting** | Prevents API abuse at the middleware level |

---

## 🏗️ Tech Stack

```
Runtime          →  Node.js v18+
Framework        →  Express.js
Database         →  MongoDB + Mongoose
Authentication   →  JWT + bcrypt + Google OAuth 2.0
Real-time        →  Socket.io (presence, live events)
AI               →  Google Gemini API
VCS Integration  →  GitHub REST API
File Storage     →  Google Drive API
Security         →  Helmet, CORS, Rate Limiting
Logging          →  Morgan
Frontend Host    →  Vercel
Backend Host     →  Render
Database Host    →  MongoDB Atlas
```

---

## 🟢 Real-Time Presence — Socket.io

One of CollabOS's standout features is **live team presence**. Every authenticated user emits their status to the server when they connect, and all teammates can instantly see who's online — no polling, no refresh.

**How it works:**

```
User Opens CollabOS
       ↓
   JWT Verified
       ↓
 Socket.io Handshake
       ↓
Server registers user as "online"
       ↓
Broadcasts to all team members
       ↓
🟢 Avatar goes live in dashboard
       ↓
On disconnect → status removed, team notified
```

**Events:**
| Event | Direction | Description |
|---|---|---|
| `user:online` | Client → Server | User connected |
| `user:offline` | Server → Client | User disconnected |
| `team:presence` | Server → Client | Full list of online team members |
| `task:updated` | Server → Client | Real-time task status change |

---

## 🔑 Google OAuth Flow

Users can authenticate with their Google account instead of (or in addition to) email/password.

```
User clicks "Sign in with Google"
           ↓
  Redirected to Google Consent Screen
           ↓
  Google returns auth code
           ↓
  Backend exchanges code → access + refresh tokens
           ↓
  User record created / updated in MongoDB
           ↓
  JWT issued → user is logged in
           ↓
  Google tokens stored for Drive/Docs integration
```

This same OAuth session is also reused for **Google Drive** and **Google Docs** access — no re-authentication needed.

---

## 📁 Project Structure

```
collabos-backend/
├── config/           # DB connection, environment setup
├── controllers/      # Route handler logic
├── middleware/        # Auth, error handler, rate limiter, logger
├── models/           # Mongoose schemas
├── routes/           # Express route definitions
├── services/         # External API logic (GitHub, Google, Gemini)
├── sockets/          # Socket.io event handlers & presence logic
├── utils/            # Helper functions
├── .env.example      # Environment variable template
└── server.js         # App entry point + Socket.io init
```

---

## 🗄️ Data Models

<details>
<summary><strong>User</strong> — Account & profile</summary>

| Field | Type | Notes |
|---|---|---|
| `name` | String | Display name |
| `email` | String (unique) | Login identifier |
| `password` | String | bcrypt hashed (null for OAuth users) |
| `role` | String | e.g. `admin`, `developer` |
| `skills` | Array | Tech skills list |
| `googleId` | String | Populated on Google OAuth sign-in |
| `avatar` | String | Profile picture URL |

</details>

<details>
<summary><strong>Team</strong> — Collaboration groups</summary>

| Field | Type |
|---|---|
| `teamName` | String |
| `owner` | ObjectId → User |
| `members` | Array → User |

</details>

<details>
<summary><strong>Project</strong> — Work units</summary>

| Field | Type |
|---|---|
| `title` | String |
| `description` | String |
| `teamId` | ObjectId → Team |
| `deadline` | Date |
| `status` | String |
| `githubRepo` | String |
| `driveFolderId` | String |

</details>

<details>
<summary><strong>Task</strong> — Actionable items</summary>

| Field | Type |
|---|---|
| `title` | String |
| `description` | String |
| `projectId` | ObjectId → Project |
| `assignedTo` | ObjectId → User |
| `status` | String |
| `deadline` | Date |

</details>

<details>
<summary><strong>Contribution</strong> — GitHub commit tracking</summary>

| Field | Type |
|---|---|
| `projectId` | ObjectId → Project |
| `userId` | ObjectId → User |
| `commitId` | String |
| `author` | String |
| `message` | String |
| `timestamp` | Date |

</details>

<details>
<summary><strong>Google Integration</strong> — Workspace connection</summary>

| Field | Type |
|---|---|
| `userId` | ObjectId → User |
| `projectId` | ObjectId → Project |
| `accessToken` | String |
| `refreshToken` | String |
| `folderId` | String |
| `googleEmail` | String |

</details>

---

## 🔌 API Reference

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login & receive JWT | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow | ❌ |
| `GET` | `/api/auth/google/callback` | Google OAuth callback | ❌ |

**Register:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

---

### 👥 Teams

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/teams` | Create a team | ✅ |
| `POST` | `/api/teams/add-member` | Add member to team | ✅ |
| `GET` | `/api/teams/:teamId` | Get team details & members | ✅ |

---

### 📁 Projects

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/projects` | Create project manually | ✅ |
| `POST` | `/api/projects/create-with-ai` | AI-generated project + tasks | ✅ |
| `GET` | `/api/projects` | List all projects | ✅ |

---

### 🧩 Tasks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/tasks` | Create a task | ✅ |
| `PUT` | `/api/tasks/:taskId` | Update task status | ✅ |
| `GET` | `/api/tasks/project/:projectId` | Get all tasks for a project | ✅ |

---

### 🤖 AI

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/generate-tasks` | Auto-generate tasks with Gemini | ✅ |

```json
{
  "title": "CollabOS",
  "description": "AI-powered team collaboration platform",
  "techStack": ["React", "Node.js", "MongoDB"]
}
```

---

### 🔗 GitHub Integration

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/integrations/github/connect` | Connect GitHub account | ✅ |
| `GET` | `/api/integrations/github/commits/:projectId` | Sync & view commits | ✅ |
| `GET` | `/api/integrations/github/contributions/:projectId` | Contribution analytics | ✅ |

---

### 📄 Google Workspace

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/integrations/google/connect` | Connect Google account | ✅ |
| `POST` | `/api/integrations/google/link-folder` | Link a Drive folder | ✅ |
| `GET` | `/api/integrations/google/docs/:projectId` | Get project-linked Docs | ✅ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google Cloud project (OAuth + Drive API enabled)
- GitHub OAuth App
- Gemini API key

### 1. Clone

```bash
git clone <repo-url>
cd collabos-backend
```

### 2. Install

```bash
npm install
```

### 3. Configure `.env`

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth + Workspace
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### 4. Run

```bash
npm run dev
```

API: `http://localhost:5000`  
Socket.io: same port, auto-upgraded

---

## 🛡️ Middleware

| Middleware | Purpose |
|---|---|
| `authMiddleware` | Validates JWT on protected routes |
| `socketAuth` | Authenticates Socket.io connections via JWT |
| `errorHandler` | Centralized error formatting |
| `rateLimiter` | Prevents API abuse (express-rate-limit) |
| `morgan` | HTTP request logging |

---

## 🌐 Deployment

| Layer | Platform | URL |
|---|---|---|
| Frontend | Vercel | [collab-os-frontend.vercel.app](https://collab-os-frontend.vercel.app/) |
| Backend | Render | your-backend.render.com |
| Database | MongoDB Atlas | cloud.mongodb.com |

> **Note:** When deploying, update `CLIENT_URL` and all OAuth callback URIs to match your production domains. Vercel automatically handles HTTPS — make sure your backend CORS config whitelists the Vercel domain.

---

## 🔄 Full Application Flow

```
User Signs Up / Google OAuth
           ↓
    JWT Token Issued
           ↓
  Socket.io Connection ──────────► 🟢 Live Presence in Team Dashboard
           ↓
      Creates Team
           ↓
     Creates Project
           ↓
  AI Generates Tasks (Gemini) ──► Tasks auto-assigned to team
           ↓
    GitHub Repo Connected
           ↓
   Commits Synced & Tracked ─────► Contribution Analytics Per Dev
           ↓
  Google Drive Folder Linked
           ↓
  Docs Accessible Per Project
           ↓
       Dashboard View
```

---

## 📌 Roadmap

| Phase | Feature | Status |
|---|---|---|
| Phase 1 | Auth, Teams, Projects, Tasks | ✅ Complete |
| Phase 2 | Gemini AI Task Generation | ✅ Complete |
| Phase 3 | GitHub Tracking & Analytics | ✅ Complete |
| Phase 4 | Google Workspace Integration | ✅ Complete |
| Phase 5 | Real-Time Presence (Socket.io) | ✅ Complete |
| Phase 6 | Google OAuth Sign-In | ✅ Complete |


---

## 👨‍💻 Authors

Built with ❤️ by the **CollabOS Team**

---

## 📄 License

[MIT License](LICENSE)

---

<div align="center">
  <sub>CollabOS — AI · GitHub · Google Workspace · Real-Time Presence · Team Intelligence</sub>
  <br/><br/>
  <a href="https://collab-os-frontend.vercel.app/">🌐 Live Demo</a>
</div>
