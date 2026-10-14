# 🚀 Ansh Portfolio — Full-Stack Developer Platform

[![Live Portfolio](https://img.shields.io/badge/Live_Portfolio-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ansh-portf-1.onrender.com)
[![Admin Panel](https://img.shields.io/badge/Admin_Dashboard-Render-5555FF?style=for-the-badge&logo=render&logoColor=white)](https://ansh-portf-2.onrender.com)
[![API Status](https://img.shields.io/badge/REST_API-Online-success?style=for-the-badge&logo=fastapi&logoColor=white)](https://ansh-portf-2cf4.onrender.com/api/health)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A production-ready, full-stack personal portfolio and content management system architected into **three decoupled, independently scalable micro-services**:

1. **Portfolio Client** — Modern, high-performance showcase website with 3D canvas visuals.
2. **Admin Dashboard** — Secure, authenticated control panel for managing projects, skills, inquiries, and interests.
3. **Backend REST API** — Express.js and MongoDB service featuring JWT authentication and persistent multi-tier image storage designed for ephemeral cloud containers.

---

## 🌐 Live Deployments

| Component | Role | Live URL |
| :--- | :--- | :--- |
| **Portfolio Client** | Public Showcase & Contact | [https://ansh-portf-1.onrender.com](https://ansh-portf-1.onrender.com) |
| **Admin Panel** | Content & Inquiries Management | [https://ansh-portf-2.onrender.com](https://ansh-portf-2.onrender.com) |
| **Backend REST API** | Core API & Image Delivery Engine | [https://ansh-portf-2cf4.onrender.com/api](https://ansh-portf-2cf4.onrender.com/api) |

---

## 🏛️ Project Architecture

```
Ansh portf/
├── backend/                  → Node.js + Express REST API Server (:5000)
│   ├── config/               → Database & Cloudinary configurations
│   ├── controllers/          → Auth, Projects, Skills, Messages, Uploads
│   ├── data/                 → Default/fallback JSON data
│   ├── middleware/           → JWT authentication & error handling
│   ├── models/               → Mongoose schemas (Project, Skill, Message, Image)
│   ├── routes/               → Express route definitions
│   ├── utils/                → Persistent image storage & admin seeding
│   ├── uploads/              → Local file cache & image assets
│   └── server.js             → API server entry point
│
├── frontend/                 → Public Portfolio Web Application (:3000)
│   ├── css/                  → Modern dark glassmorphic design system
│   ├── js/                   → UI controllers, API client, Three.js 3D canvas
│   ├── grocerystore.png      → Bundled static asset fallback
│   ├── index.html            → Semantic HTML5 single-page portfolio
│   └── server.js             → Production static web server
│
└── admin/                    → Private CMS & Management Dashboard (:3001)
    ├── css/                  → Admin responsive theme & modal styles
    ├── js/                   → Dashboard logic, JWT token manager, CRUD handlers
    ├── grocerystore.png      → Admin asset fallback
    ├── index.html            → Dashboard UI
    └── server.js             → Production static web server
```

---

## ✨ Key Features

### 🌟 1. Portfolio Client (`frontend/`)
- **Interactive 3D Graphics**: Particle animation canvas driven by **Three.js** that responds to cursor interaction.
- **Dynamic Projects Showcase**: Real-time project feed populated directly from MongoDB with live deployment links, GitHub repository buttons, and category filters.
- **Technical Skills Matrix**: Visual breakdown of frontend, backend, database, and devops proficiencies.
- **Curated Interests & Hobbies**: Interactive cards displaying personal passions and tech exploration.
- **Contact Inquiries Form**: Direct inquiry submission with real-time feedback and server-side validation.
- **Glassmorphic Dark UI**: Curated modern typography, smooth scroll spy, mobile hamburger navigation, and micro-interactions.

### 🛡️ 2. Admin Dashboard (`admin/`)
- **Secure Authentication**: Protected via JSON Web Tokens (JWT) stored securely in client storage with automatic expiration checks.
- **Metrics Overview**: Real-time counter widgets for total projects, total skills, total contact messages, and unread notifications.
- **Full Project CRUD**: Create, edit, reorder, feature, and delete portfolio items with instantaneous preview cards.
- **Integrated Image Uploader**: Direct image upload support with automatic resolution and thumbnail preview.
- **Skills & Interests Management**: Live editing of skill categories, progress bars, and personal hobby tags.
- **Contact Messages Inbox**: Read inquiries, toggle read/unread status, and perform one-click `mailto:` replies.

### ⚡ 3. Backend REST API (`backend/`)
- **MongoDB Atlas Integration**: Primary database persistence with resilient fallback to `mongodb-memory-server` if offline during local tests.
- **Persistent Multi-Tier Image Storage (Render Ephemeral Fix)**:
  - Cloud container hosts (such as Render free tier) have ephemeral filesystems that discard local uploads upon container restart or idle sleep.
  - This system implements a resilient multi-tier fallback:
    1. **Cloudinary Cloud Storage** (when configured).
    2. **MongoDB Atlas Binary Persistence**: Uploaded image buffers are stored directly in MongoDB Atlas and served via `/api/images/:idOrFilename`.
    3. **Ephemeral Disk Cache**: Fast in-memory / local disk read buffer.
    4. **Client-Side Bundled Fallback**: Direct fallback to static assets (`grocerystore.png`) ensuring zero broken image boxes.
- **Fine-Grained Cache Control**: HTTP caching tuned to `public, max-age=60, must-revalidate` to avoid stale CDN caching.
- **CORS & Environment Adapters**: Seamless cross-origin communication between the three independent services.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism), JavaScript (ES6+), Three.js |
| **Admin Dashboard** | HTML5, CSS3, JavaScript (ES6+), FontAwesome / Lucide Icons |
| **Backend API** | Node.js, Express.js, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `express-validator` |
| **Database** | MongoDB Atlas (Cloud) / MongoDB In-Memory Server |
| **Media & Storage** | MongoDB Binary Storage / Cloudinary SDK / Local Cache |
| **Hosting & CI/CD** | Render Web Services (Independent Micro-deployments) |

---

## 🔌 API Endpoints Reference

### 🔐 Authentication
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate admin user and issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |

### 💼 Projects
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Retrieve all projects (sorted by order/date) | Public |
| `GET` | `/api/projects/:id` | Retrieve single project by ID | Public |
| `POST` | `/api/projects` | Create a new project | Private |
| `PUT` | `/api/projects/:id` | Update existing project details | Private |
| `DELETE` | `/api/projects/:id` | Delete a project | Private |

### 🖼️ Images & Media
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload new image (returns URL & MongoDB ID) | Private |
| `GET` | `/api/images/:idOrFilename` | Serve binary image from DB or local cache | Public |

### 🛠️ Skills
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/skills` | List all skills grouped by category | Public |
| `POST` | `/api/skills` | Add new skill | Private |
| `PUT` | `/api/skills/:id` | Update skill name or proficiency | Private |
| `DELETE` | `/api/skills/:id` | Remove skill | Private |

### 🎯 Interests & Hobbies
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/interests` | List interest categories and items | Public |
| `POST` | `/api/interests` | Create a new interest category | Private |
| `PUT` | `/api/interests/:id` | Update interest category | Private |
| `DELETE` | `/api/interests/:id` | Delete interest category | Private |
| `POST` | `/api/interests/:id/items` | Add item to category | Private |
| `DELETE` | `/api/interests/:id/items/:itemId` | Remove item from category | Private |

### 📬 Contact Inquiries & Health
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/messages` | Submit a new contact message | Public |
| `GET` | `/api/messages` | List all contact inquiries | Private |
| `PATCH` | `/api/messages/:id/read` | Toggle read/unread status | Private |
| `DELETE` | `/api/messages/:id` | Delete an inquiry | Private |
| `GET` | `/api/health` | Service health status check | Public |

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) database cluster (or local MongoDB)

### Step 1: Clone Repository
```bash
git clone https://github.com/kaundalanshul/Ansh-portf.git
cd "Ansh portf"
```

### Step 2: Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
# Server Port
PORT=5000

# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/portfolio?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Initial Admin Credentials (used during auto-seed)
ADMIN_EMAIL=admin@anshportfolio.com
ADMIN_PASSWORD=Admin@123

# Cloudinary Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Step 3: Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
> The API will start on `http://localhost:5000/api`.

### Step 4: Install & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm start
```
> The portfolio website will start on `http://localhost:3000`.

### Step 5: Install & Start Admin Dashboard
In a third terminal window:
```bash
cd admin
npm install
npm start
```
> The admin panel will start on `http://localhost:3001`.

---

## 🚀 Deployment Guide (Render)

The application is deployed on Render as **three separate Web Services**:

### 1. Backend Web Service (`ansh-portf-2cf4`)
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `PORT` = `5000`
  - `MONGODB_URI` = `<your-mongodb-atlas-uri>`
  - `JWT_SECRET` = `<your-jwt-secret>`
  - `ADMIN_EMAIL` = `<your-admin-email>`
  - `ADMIN_PASSWORD` = `<your-admin-password>`

### 2. Frontend Web Service (`ansh-portf-1`)
- **Environment**: Node
- **Root Directory**: `frontend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `PORT` = `3000`

### 3. Admin Web Service (`ansh-portf-2`)
- **Environment**: Node
- **Root Directory**: `admin`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `PORT` = `3001`

---

## 🔒 Security & Best Practices

- **Zero Hardcoded Secrets**: Sensitive credentials and JWT keys are strictly loaded via environment variables.
- **Hashed Passwords**: Admin passwords are encrypted using `bcryptjs` before being saved to the database.
- **Protected Routes**: All modification routes (projects, skills, interests, inbox) require valid Bearer JWT tokens.
- **Client-Side Sanitization**: Input fields are validated both on the client and with `express-validator` on the server.
- **Ephemeral-Resilient Storage**: Images are backed up in MongoDB Atlas binary documents, surviving Render container reboots and cold sleep restarts.

---

## 👤 Author

**Anshul Kaundal**
- Portfolio: [https://ansh-portf-1.onrender.com](https://ansh-portf-1.onrender.com)
- GitHub: [@kaundalanshul](https://github.com/kaundalanshul)
- Email: [kaundalanshul725@gmail.com](mailto:kaundalanshul725@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use and adapt it for your own portfolio.
