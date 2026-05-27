<div align="center">

# Collabrix

**AI-powered real-time collaboration platform for modern developer teams.**

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com)
[![Stack](https://img.shields.io/badge/stack-MERN-blue)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

*One platform. Every tool your team needs.*

</div>

---

## What is Collabrix?

Most small dev teams juggle 5–6 disconnected tools: WhatsApp for chat, Notion for planning, GitHub for code, Trello for tasks, and ChatGPT for help. The context switching kills productivity.

Collabrix brings it all together — real-time chat, task management, project organization, and AI assistance — into a single collaborative workspace built specifically for student developers, hackathon teams, and small startups.

---

## The Problem

| Pain Point | Reality |
|---|---|
| Too many tools | Teams switch between 5+ apps daily |
| Poor organization | Work scattered across platforms |
| Communication gaps | Chat and tasks live in separate silos |
| No AI integration | Productivity tools are still manual-first |
| Enterprise bloat | Existing tools aren't built for small teams |

---

## Core Features

### Authentication
- Email/password, Google OAuth, GitHub OAuth
- JWT-based sessions with protected routes
- User profiles with skills, bio, avatar, and role

### Workspaces
- Team environments with invite-based membership
- Role system: Owner → Admin → Member → Viewer
- Shared project and channel organization

### Real-Time Chat
- Channel-based messaging powered by Socket.IO
- Typing indicators, online presence, message timestamps
- File sharing support

### Task Management
- Kanban workflow: `Todo → In Progress → Review → Completed`
- Task assignment, due dates, priority labels, comments
- Visual progress tracking per project

### Project Dashboard
- Multiple projects per workspace
- Activity feed, member management, timelines
- Productivity overview at a glance

### AI Assistant
- Chat/discussion summaries
- Smart task suggestions and sprint planning ideas
- Documentation generation (READMEs, descriptions, summaries)
- Workflow optimization suggestions

### Notifications
- Task assignments, mentions, workspace invites
- Project updates and AI-generated insights

---

## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/) — styling
- [Socket.IO Client](https://socket.io/) — real-time
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — forms & validation
- Zustand / Context API — state management

**Backend**
- [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/) — real-time engine
- JWT + bcrypt — authentication & password hashing

**AI**
- OpenAI API / Gemini API

**Deployment**
- Frontend → [Vercel](https://vercel.com/)
- Backend → [Render](https://render.com/) / [Railway](https://railway.app/)
- Database → [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## Project Structure

```
COLLABRIX/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Project.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Workspace.jsx
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── routes.jsx
│   │   └── index.css
│   │
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── aiController.js
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── workspaceController.js
│   │   │
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   ├── package.json
│   └── node_modules/
│
├── .gitignore
└── README.md
```

---

## Database Models

| Model | Key Fields |
|---|---|
| **User** | profile, auth credentials, workspace refs, assigned tasks |
| **Workspace** | members, projects, channels, permissions |
| **Project** | tasks, progress, deadlines, contributors |
| **Task** | status, assignee, due date, priority, comments |
| **Message** | sender, workspace, content, timestamps |

---

## Real-Time Architecture

Socket.IO powers live collaboration across:

- Team chat and typing indicators
- Online presence and status
- Task and project updates
- Workspace sync
- Notification delivery

---

## Security

- Password hashing with bcrypt
- JWT validation on all protected routes
- Role-based access control
- Environment variable management
- Rate limiting
- Secure cookies

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/collabrix.git
cd collabrix

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key   # or Gemini
CLIENT_URL=http://localhost:3000
```

```bash
# Run backend
cd backend
npm run dev

# Run frontend (separate terminal)
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## MVP Scope

**Shipping first:**
- [x] Authentication system
- [x] Workspace creation and invites
- [x] Real-time team chat
- [x] Task management (kanban)
- [x] Project dashboard
- [x] Basic AI summaries

**Coming later:**
- [ ] GitHub repository integration
- [ ] Video calls and screen sharing
- [ ] AI code review
- [ ] Team analytics and sprint insights
- [ ] Mobile app (React Native)
- [ ] Calendar and scheduling

---

## Why JavaScript (not TypeScript)?

Collabrix is intentionally built in JavaScript for faster iteration, easier onboarding, and a hackathon-friendly workflow. The goal is shipping a working product first. TypeScript can be adopted later as the codebase matures.

---

## Roadmap

| Phase | Focus |
|---|---|
| MVP | Auth, workspaces, chat, tasks, basic AI |
| v1.1 | Advanced AI features, analytics dashboard |
| v1.2 | GitHub integration, richer notifications |
| v2.0 | Video collaboration, mobile app, AI code review |
| Long-term | Full AI-powered collaborative OS for dev teams |

---

## Target Users

- **Student developers** — hackathon teams, college project groups, coding clubs
- **Startup teams** — indie founders, MVP builders, remote collaborators
- **Technical creators** — freelancers, product builders, UI/UX designers

---

