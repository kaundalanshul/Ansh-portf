/**
 * Database Configuration
 * ──────────────────────
 * Connects to MongoDB using Mongoose.
 * Uses MONGO_URI from environment variables if available,
 * otherwise falls back to mongodb-memory-server for local development.
 */

const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Try connecting to the configured URI first
    // Use 30s timeout to allow Atlas DNS SRV resolution and TLS handshake
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
    } catch (connError) {
      console.warn('⚠️  Could not connect to MongoDB at:', uri);
      console.warn(`⚠️  Error detail: ${connError.message}`);
      console.log('📦 Starting in-memory MongoDB for development...');

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);

      console.log('💡 Data will not persist after server restart.');
      console.log('   Install MongoDB locally or use Atlas for persistent storage.');
    }

    console.log(`✅ MongoDB connected: ${mongoose.connection.host} (Database: ${mongoose.connection.name})`);

    // Connection event listeners for monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Cleanup function for graceful shutdown
const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
