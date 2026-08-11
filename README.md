# Ansh Portfolio — Full-Stack Portfolio Website

A complete portfolio platform with a public-facing website, REST API backend, MongoDB database, and protected admin dashboard.

## 🚀 Features

- **Public Website** — Responsive single-page portfolio with Hero, About, Projects, Skills, and Contact sections
- **REST API** — Node.js + Express backend with clean MVC architecture
- **MongoDB Database** — Mongoose ODM with schemas for Admin, Project, Skill, and Message
- **Admin Dashboard** — Protected panel to manage portfolio content (CRUD) with JWT authentication
- **Contact Form** — Working form that stores messages in the database
- **Mobile Responsive** — Fully responsive dark-theme design

## 📁 Project Structure

```
├── server/               # Backend API
│   ├── config/           # Database connection
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, validation, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── utils/            # Seed scripts
│   └── server.js         # Entry point
├── public/               # Public portfolio website
│   ├── css/style.css     # Design system
│   ├── js/main.js        # Dynamic content loading
│   └── index.html        # Single-page layout
├── admin/                # Admin dashboard
│   ├── css/admin.css     # Dashboard styles
│   ├── js/auth.js        # Authentication
│   ├── js/dashboard.js   # CRUD operations
│   ├── index.html        # Login page
│   └── dashboard.html    # Dashboard panel
└── package.json
```

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js** v16+ ([download](https://nodejs.org))
- **MongoDB** running locally or a MongoDB Atlas account

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `server/.env` with your settings:

```env
MONGO_URI=mongodb://localhost:27017/ansh_portfolio
JWT_SECRET=your_super_secret_key_here
PORT=5000
ADMIN_EMAIL=admin@anshportfolio.com
ADMIN_PASSWORD=Admin@123
```

### 3. Seed admin user

```bash
npm run seed
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open in browser

- **Public Site**: [http://localhost:5000](http://localhost:5000)
- **Admin Panel**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Admin login |
| GET | `/api/auth/me` | Admin | Get profile |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Public | List all projects |
| GET | `/api/projects/:id` | Public | Get single project |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

### Skills
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/skills` | Public | List all skills |
| POST | `/api/skills` | Admin | Create skill |
| PUT | `/api/skills/:id` | Admin | Update skill |
| DELETE | `/api/skills/:id` | Admin | Delete skill |

### Messages
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/messages` | Public | Submit contact form |
| GET | `/api/messages` | Admin | List all messages |
| PATCH | `/api/messages/:id/read` | Admin | Toggle read status |
| DELETE | `/api/messages/:id` | Admin | Delete message |

## 🔐 Default Admin Credentials

- **Email**: `admin@anshportfolio.com`
- **Password**: `Admin@123`

> ⚠️ Change these in `.env` before deploying to production!

## 📄 License

MIT
