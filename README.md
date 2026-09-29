# TaskFlow

> **Organize work. Move faster. Stay in sync.**

TaskFlow is a production-ready, full-stack collaborative task management application built for modern engineering teams. It enables registered team members to create, assign, track, and complete tasks with real-time transactional Gmail email notifications, automated audit logging, and strict server-side authorization.

## Beginner's Quick Start Guide

In TaskFlow, work is organized through tasks. First time using the app? Follow this step-by-step guide.

### Running the Application

The application consists of two running services: the backend (data and authentication) and the frontend (web user interface). Run both in separate PowerShell or terminal windows.

1. **Backend window:** Open the `backend` folder and run `python -m venv venv`, then on Windows activate it using `venv\Scripts\Activate.ps1` (or `source venv/bin/activate` on macOS/Linux). Install dependencies using `python -m pip install -r requirements.txt`. Make a copy of `.env.example` named `.env`, fill in your Supabase configuration, and run `python run.py`. The backend will run on `http://localhost:5000`.
2. **Frontend window:** Open the `frontend` folder, make a copy of `.env.example` named `.env.local`, and configure your Supabase URL, anon public key, and backend URL (`http://localhost:5000`). Run `npm ci` (or `npm install`) followed by `npm run dev`. Open `http://localhost:3000` in your browser.
3. Sign in using the Google button. Your profile is automatically created upon your first successful login; you and all registered teammates will appear in the Team directory.

> `.env` and `.env.local` contain private keys and secrets. Never share these files or commit them to Git. When Gmail credentials are configured, email notifications are automatically dispatched when tasks are assigned or marked completed.

### Daily Workflow

1. **Dashboard:** View high-level metrics including task counts, tasks assigned to you, upcoming due dates, and recent activity updates.
2. **Create Task:** Click **Create Task**. Enter a title, optional description, and due date, select an assignee teammate, choose a priority level, and save. You can also assign tasks to yourself.
3. **My Tasks:** Displays tasks assigned to you. Open any task to update its status to `Todo`, `In Progress`, or `Completed`.
4. **Created by Me:** Displays tasks you created, whether assigned to yourself or a teammate.
5. **Team:** View registered team members along with their assigned and completed task counts. To assign work to someone, they must first sign in to the application to register their account.
6. **Settings:** View your Google profile information or sign out.

### Key Concepts in Brief

- **Creator:** The team member who created the task.
- **Assignee:** The team member responsible for completing the task.
- **Priority:** The urgency of the task — Low, Medium, or High.
- **Due date:** The target completion deadline (optional).
- **Status:** The current stage of the task (`Todo`, `In Progress`, or `Completed`).

### Troubleshooting

- Open `http://localhost:5000/health` in your browser. A response of `{"status":"ok"}` confirms that the backend is running.
- The frontend runs at `http://localhost:3000`. Keep in mind that even after modifying or restarting the backend, the frontend must also be running.
- If login, team members, or tasks fail to load, check your `.env` and `.env.local` files, verify Supabase settings, and inspect terminal error logs. Ensure the backend's `FRONTEND_URL` is set to `http://localhost:3000`.
- Google OAuth will only function if the Google provider is properly enabled in Supabase and the callback redirect URLs are correctly configured.

---

## Overview

TaskFlow implements a streamlined **peer-to-peer task management workflow**:
- Every authenticated user can create tasks, assign work to teammates, track tasks assigned to them, and complete tasks.
- Authentication is handled via **Google OAuth 2.0** and **Supabase Auth**.
- Business logic, authorization rules, and email dispatch reside entirely in a modular **Flask REST API**.
- Transactional emails are dispatched via the official **Google Gmail API** with an automated audit log in PostgreSQL.
- The user interface is built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**, designed with an editorial, Linear-inspired SaaS aesthetic.

---

## Features

- 🔐 **Google OAuth 2.0**: Secure authentication via Supabase Auth with automatic session persistence.
- 📋 **My Tasks (Kanban Board)**: Drag-free, accessible Kanban board with `Todo`, `In Progress`, and `Completed` columns.
- 📝 **Created by Me**: Dedicated view to track delegated tasks without confusing them with personal to-dos.
- 📊 **Personalized Dashboard**: Real-time summary metrics (`Total Tasks`, `Assigned To Me`, `In Progress`, `Completed`), approaching deadlines, and recent activity audit.
- 👥 **Team Directory**: View all registered teammates, their emails, assigned task counts, and completed task counts.
- 🔍 **Search & Filters**: Instant search by task title or description, filterable by Status, Priority, and Assignee.
- 📱 **Responsive Design**: Flawless experience across desktop, tablet, and mobile viewports with collapsible drawer navigation.
- 📧 **Automated Gmail Notifications**:
  - Assignee receives an email when a task is assigned.
  - Creator receives an email when a task is completed.
- 📝 **Audit Logging**: Every email dispatch attempt (success or failure) is logged to `notification_logs`.
- 🛡️ **Zero-Trust Server Authorization**: Backend verifies JWTs and strictly enforces creator vs. assignee permissions.

---

## Architecture

```
Browser
  ↓
Next.js (TypeScript + Tailwind CSS)
  ├── Supabase Auth → Google OAuth 2.0 (PKCE)
  └── Flask REST API (Python 3.11+)
        ├── Supabase PostgreSQL (Profiles, Tasks, Notification Logs)
        └── Gmail API (OAuth 2.0 Refresh Token)
```

### Architectural Decisions
1. **Frontend / Backend Split**: The frontend handles UI state, routing, and OAuth initiation. The Flask backend independently verifies JWT tokens, preventing clients from spoofing identity or bypassing business rules.
2. **Decoupled Email Service**: Email notifications are executed after database persistence. If Gmail experiences temporary network failure or rate limits, the task remains safely saved, and the failure is recorded in `notification_logs`.
3. **Peer-to-Peer Roles**: To keep collaboration fluid and avoid unnecessary manager hierarchies, all users have equal capability to create and assign tasks to any registered peer.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 16 (App Router) | Server-rendered and static React application |
| **Language** | TypeScript | Strong typing for compile-time safety |
| **Styling** | Tailwind CSS + shadcn/ui primitives | Clean, restrained Linear-inspired SaaS design system |
| **Icons** | Custom accessible SVGs | Lightweight, zero-dependency icon suite |
| **Backend Framework**| Flask 3.x (Python) | Modular REST API with Application Factory pattern |
| **Database** | PostgreSQL 15+ (Supabase) | Relational persistence with foreign keys and check constraints |
| **Authentication** | Supabase Auth + Google OAuth 2.0 | Secure OAuth 2.0 PKCE flow and JWT session management |
| **Email Service** | Google Gmail API (`google-api-python-client`) | Automated transactional notification delivery |
| **Testing** | Pytest + Flask Test Client | Automated integration and authorization test suite |

---

## Project Structure

```
assignment/
├── migrations/                     # Canonical database SQL migrations
│   ├── 001_create_profiles.sql
│   ├── 002_create_tasks.sql
│   ├── 003_create_notification_logs.sql
│   └── combined_schema.sql
│
├── frontend/                       # Next.js 16 application
│   ├── app/
│   │   ├── login/page.tsx          # Google OAuth login
│   │   ├── dashboard/page.tsx      # Overview metrics & activity
│   │   ├── tasks/page.tsx          # My Tasks Kanban board
│   │   ├── created/page.tsx        # Created by Me list
│   │   ├── team/page.tsx           # Team directory
│   │   ├── settings/page.tsx       # Account & session management
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/                 # Sidebar, Header
│   │   ├── tasks/                  # TaskBoard, TaskCard, TaskModal, TaskDrawer
│   │   ├── users/                  # UserAvatar, UserSelector
│   │   └── ui/                     # Dialog, Button, Select, Alert primitives
│   ├── hooks/                      # useAuth, useTasks
│   ├── lib/                        # api.ts, supabase.ts, utils.ts
│   └── types/                      # task.ts, user.ts
│
├── backend/                        # Flask REST API
│   ├── app/
│   │   ├── routes/                 # auth.py, tasks.py, users.py
│   │   ├── services/               # task_service.py, gmail_service.py, notification_service.py
│   │   ├── middleware/             # auth.py (@require_auth decorator)
│   │   ├── utils/                  # validation.py, errors.py
│   │   └── config.py               # Environment configuration & validation
│   ├── tests/                      # test_auth_middleware.py, test_tasks.py, test_gmail.py
│   ├── Procfile                    # Production WSGI entry point
│   ├── requirements.txt            # Python dependencies
│   └── run.py                      # Local development runner
└── README.md                       # Complete documentation
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REFRESH_TOKEN=your-gmail-oauth-refresh-token
GMAIL_SENDER_EMAIL=notifications@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

---

## Google OAuth Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create a project and navigate to **APIs & Services** → **Credentials**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Add Authorized Redirect URIs:
   - Supabase Callback: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Local Callback: `http://localhost:3000/dashboard`
5. Note down `Client ID` and `Client Secret`.

---

## Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to **Authentication** → **Providers** → Enable **Google**:
   - Paste your Google `Client ID` and `Client Secret`.
3. Open the **SQL Editor** in Supabase and run the migration files in order:
   - `migrations/001_create_profiles.sql`
   - `migrations/002_create_tasks.sql`
   - `migrations/003_create_notification_logs.sql`
   *(Alternatively, run `migrations/combined_schema.sql` to execute all at once).*

---

## Gmail API Setup

1. In Google Cloud Console, enable the **Gmail API**.
2. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - Click the gear icon (top right) → check **Use your own OAuth credentials** → enter your Client ID & Secret.
   - Select scope: `https://www.googleapis.com/auth/gmail.send`.
   - Authorize API and exchange authorization code for a **Refresh Token**.
3. Save `GOOGLE_REFRESH_TOKEN` and `GMAIL_SENDER_EMAIL` into `backend/.env`.

---

## Local Development

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
python run.py
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Fill in your .env.local values
npm install
npm run dev
# Application runs on http://localhost:3000
```

---

## Database Migrations

Database tables and constraints are defined in `/migrations`:

- **`001_create_profiles.sql`**: Mirrors authenticated Google users with auto-updating timestamps.
- **`002_create_tasks.sql`**: Core tasks table with foreign key relationships (`created_by`, `assigned_to`), check constraints for status and priority, and query indexes.
- **`003_create_notification_logs.sql`**: Audit table recording every outgoing transactional notification attempt.

---

## API Endpoints

All endpoints require `Authorization: Bearer <supabase_access_token>`.

| Method | Route | Description | Access Control |
|---|---|---|---|
| `GET` | `/api/me` | Fetch or sync current user profile | Authenticated user |
| `GET` | `/api/users` | List all registered teammates | Authenticated user |
| `GET` | `/api/tasks` | List tasks where user is creator or assignee | Authenticated user |
| `GET` | `/api/tasks/<task_id>` | Get task detail | Creator or Assignee |
| `POST` | `/api/tasks` | Create task & dispatch assignment email | Authenticated user |
| `PATCH` | `/api/tasks/<task_id>` | Update task fields (status, priority, etc.) | Creator (all), Assignee (status only) |
| `PATCH` | `/api/tasks/<task_id>/complete` | Mark task completed & dispatch completion email | Creator or Assignee |
| `DELETE` | `/api/tasks/<task_id>` | Permanently delete a task | Creator only |
| `GET` | `/api/notifications` | View notification audit logs for owned tasks | Creator |

### Unified Error Format
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the task creator can update this task."
  }
}
```
