# Ansh Portfolio

A full-stack portfolio website split into **three independent applications**.

## Project Structure

```
├── backend/       → REST API server (Express + MongoDB)   → port 5000
├── frontend/      → Portfolio website (static HTML/CSS/JS) → port 3000
├── admin/         → Admin dashboard (static HTML/CSS/JS)   → port 3001
```

Each part is **completely independent** — it has its own `package.json`, `node_modules`, and can be developed, deployed, and scaled separately.

---

## Quick Start

### 1. Backend (start first)

```bash
cd backend
npm install
npm run dev
```

API will be available at `http://localhost:5000/api`

**Default admin credentials** (see `backend/.env`):
- Email: `admin@anshportfolio.com`
- Password: `Admin@123`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Portfolio site at `http://localhost:3000`

### 3. Admin Dashboard

```bash
cd admin
npm install
npm start
```

Admin panel at `http://localhost:3001`

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Admin login | No |
| GET | `/api/projects` | List projects | No |
| POST | `/api/projects` | Create project | Yes |
| PUT | `/api/projects/:id` | Update project | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |
| GET | `/api/skills` | List skills | No |
| POST | `/api/skills` | Create skill | Yes |
| PUT | `/api/skills/:id` | Update skill | Yes |
| DELETE | `/api/skills/:id` | Delete skill | Yes |
| POST | `/api/messages` | Submit contact message | No |
| GET | `/api/messages` | List messages | Yes |
| PATCH | `/api/messages/:id/read` | Toggle read status | Yes |
| DELETE | `/api/messages/:id` | Delete message | Yes |
| GET | `/api/health` | Health check | No |

---

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (with in-memory fallback), JWT auth
- **Frontend**: HTML, CSS, JavaScript, Three.js (3D)
- **Admin**: HTML, CSS, JavaScript
