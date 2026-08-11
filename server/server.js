/**
 * Server Entry Point
 * ──────────────────
 * Express application setup with:
 * - CORS configuration
 * - JSON body parsing
 * - Static file serving (public site + admin dashboard)
 * - API route mounting
 * - Global error handling
 * - MongoDB connection
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectDB, closeDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const skillRoutes = require('./routes/skillRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Initialize Express app
const app = express();

/* ── Middleware ─────────────────────────────────── */

// Enable CORS for all origins (tighten in production)
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

/* ── Static File Serving ───────────────────────── */

// Serve the public portfolio website
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// Serve the admin dashboard
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

/* ── API Routes ────────────────────────────────── */

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/* ── 404 Handler for API routes ────────────────── */

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ── Catch-all: serve public site for SPA-style navigation ── */

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/* ── Global Error Handler ──────────────────────── */

app.use(errorHandler);

/* ── Start Server ──────────────────────────────── */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Auto-seed admin user if none exists
    // (Essential for in-memory DB which starts empty each time)
    const Admin = require('./models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
      console.log(`🌱 Admin seeded: ${process.env.ADMIN_EMAIL}`);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Public site:  http://localhost:${PORT}`);
      console.log(`🔐 Admin panel:  http://localhost:${PORT}/admin`);
      console.log(`📡 API base:     http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      server.close();
      await closeDB();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
