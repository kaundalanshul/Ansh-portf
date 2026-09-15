/**
 * Admin Seed Script
 * ─────────────────
 * Creates the initial admin user from .env credentials.
 * Run with: npm run seed
 *
 * Safe to run multiple times — skips if admin already exists.
 * Uses mongodb-memory-server fallback if local MongoDB isn't available.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  let mongoServer = null;

  try {
    let uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    // Try connecting, fall back to in-memory if needed
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    } catch {
      console.warn('⚠️  Could not connect to MongoDB at:', uri);
      console.log('📦 Using in-memory MongoDB...');

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);

      console.log('⚠️  Note: seed data will not persist with in-memory MongoDB.');
      console.log('   The server will auto-seed when started with memory server.');
    }

    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${email}`);
      console.log('   Skipping creation. Delete the user first if you want to re-seed.');
    } else {
      // Create new admin
      const admin = await Admin.create({ email, password });
      console.log(`✅ Admin user created successfully!`);
      console.log(`   Email: ${admin.email}`);
    }

    // Disconnect and exit
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
