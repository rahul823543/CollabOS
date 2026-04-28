<div align="center">

# 🚀 CollabOS Backend

### AI-Powered Collaboration Operating System

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*Unify your team. Automate the grind. Ship faster.*

</div>

---

## 📖 What is CollabOS?

CollabOS is a production-grade backend API that acts as the intelligence layer for modern dev teams. It combines **AI-powered project planning**, **GitHub contribution tracking**, **Google Workspace integration**, and **team analytics** into a single cohesive system.

Stop juggling ten tools. CollabOS connects them all.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth System** | JWT-based auth with bcrypt password hashing |
| 👥 **Team Management** | Create teams, manage members, assign roles |
| 📁 **Project Planning** | Create projects manually or let AI do it |
| 🤖 **AI Task Generation** | Gemini AI auto-generates tasks from your project description |
| 🔗 **GitHub Integration** | Sync commits, track contributions per project |
| 📄 **Google Workspace** | Link Drive folders, access Docs per project |
| 📊 **Analytics** | Contribution analytics per project and user |

---

## ⚙️ Tech Stack

```
Runtime       →  Node.js
Framework     →  Express.js
Database      →  MongoDB + Mongoose
Auth          →  JWT + bcrypt
AI            →  Google Gemini API
Integrations  →  GitHub API + Google OAuth
Security      →  Helmet, Rate Limiting, CORS
Logging       →  Morgan
```

---

## 📁 Project Structure

```
collabos-backend/
├── config/           # DB connection, environment config
├── controllers/      # Route handler logic
├── middleware/       # Auth, error handler, rate limiter, logger
├── models/           # Mongoose schemas
├── routes/           # Express route definitions
├── services/         # External API logic (GitHub, Google, Gemini)
├── utils/            # Helper functions
├── .env.example      # Environment variable template
└── server.js         # App entry point
```

---

## 🗄️ Data Models

<details>
<summary><strong>User</strong> — Account & profile</summary>

| Field | Type |
|---|---|
| `name` | String |
| `email` | String (unique) |
| `password` | String (hashed) |
| `role` | String |
| `skills` | Array |

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

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login & receive JWT | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |

**Register example:**
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

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/teams` | Create a team | ✅ |
| `POST` | `/api/teams/add-member` | Add member to team | ✅ |
| `GET` | `/api/teams/:teamId` | Get team members | ✅ |

---

### 📁 Projects

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/projects` | Create project manually | ✅ |
| `POST` | `/api/projects/create-with-ai` | Create project + AI-generated tasks | ✅ |
| `GET` | `/api/projects` | List all projects | ✅ |

---

### 🧩 Tasks

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/tasks` | Create a task | ✅ |
| `PUT` | `/api/tasks/:taskId` | Update task status | ✅ |
| `GET` | `/api/tasks/project/:projectId` | Get tasks for a project | ✅ |

---

### 🤖 AI

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai/generate-tasks` | Generate tasks with Gemini AI | ✅ |

**Request body:**
```json
{
  "title": "CollabOS",
  "description": "Team collaboration platform",
  "techStack": ["React", "Node.js"]
}
```

---

### 🔗 GitHub Integration

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/integrations/github/connect` | Connect GitHub account | ✅ |
| `GET` | `/api/integrations/github/commits/:projectId` | Sync commits | ✅ |
| `GET` | `/api/integrations/github/contributions/:projectId` | View contribution analytics | ✅ |

---

### 📄 Google Workspace Integration

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/integrations/google/connect` | Connect Google account | ✅ |
| `POST` | `/api/integrations/google/link-folder` | Link a Drive folder | ✅ |
| `GET` | `/api/integrations/google/docs/:projectId` | Get linked Docs | ✅ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Gemini API key
- GitHub OAuth app
- Google OAuth credentials

### 1. Clone the repository

```bash
git clone <repo-url>
cd collabos-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# AI
GEMINI_API_KEY=your_gemini_api_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback
```

### 4. Start the development server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## 🛡️ Middleware

| Middleware | Purpose |
|---|---|
| `authMiddleware` | Validates JWT on protected routes |
| `errorHandler` | Centralized error formatting |
| `rateLimiter` | Prevents API abuse |
| `morgan` | HTTP request logging |

---

## 🌐 Deployment

| Layer | Recommended Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |

---

## 🔄 Application Flow

```
User Registers / Logs In
        ↓
    Creates Team
        ↓
   Creates Project
        ↓
AI Generates Tasks (optional)
        ↓
  Tasks Get Assigned
        ↓
  GitHub Commits Tracked
        ↓
 Google Drive Linked
        ↓
Contribution Analytics
        ↓
     Dashboard
```

---

## 📌 Roadmap

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Backend Foundation (Auth, Teams, Projects, Tasks) | ✅ Complete |
| Phase 2 | AI Intelligence (Gemini task generation) | ✅ Complete |
| Phase 3 | GitHub Tracking (commits, contributions) | ✅ Complete |
| Phase 4 | Google Workspace Collaboration |✅ Complete |

---

## 👨‍💻 Authors

Built with ❤️ by the **CollabOS Team**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>CollabOS — AI + GitHub + Google Workspace + Team Intelligence</sub>
</div>
