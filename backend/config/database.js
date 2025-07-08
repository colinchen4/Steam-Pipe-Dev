const mongoose = require('mongoose');

/**
 * MongoDB database configuration for SteamPipe platform
 * Handles connection, error handling, and graceful shutdown
 */

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    
    // MongoDB connection options
    this.options = {
      // Connection management
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Buffering
      bufferMaxEntries: 0,
      bufferCommands: false,
      
      // Authentication
      authSource: 'admin',
      
      // Compression
      compressors: ['zlib'],
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
      
      // Heartbeat
      heartbeatFrequencyMS: 10000
    };
    
    this.setupEventListeners();
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      const mongoUri = this.getMongoUri();
      
      console.log('🔄 Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(mongoUri, this.options);
      this.isConnected = true;
      
      console.log('✅ MongoDB connected successfully');
      console.log(`📍 Database: ${this.connection.connection.name}`);
      console.log(`🌐 Host: ${this.connection.connection.host}:${this.connection.connection.port}`);
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      
      // Retry connection after delay
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Retrying connection in 10 seconds...');
        setTimeout(() => this.connect(), 10000);
      } else {
        console.log('💡 Running in development mode without MongoDB');
        console.log('💡 Set MONGODB_URI environment variable to enable database');
      }
      
      throw error;
    }
  }

  /**
   * Get MongoDB connection URI from environment
   */
  getMongoUri() {
    const mongoUri = process.env.MONGODB_URI || 
                    process.env.MONGO_URI || 
                    process.env.DATABASE_URL;
    
    if (!mongoUri) {
      // Development fallback
      const devUri = 'mongodb://localhost:27017/steampipe';
      console.log('⚠️  No MONGODB_URI found, using development database:', devUri);
      return devUri;
    }
    
    return mongoUri;
  }

  /**
   * Setup MongoDB event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📡 MongoDB connection established');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📡 MongoDB disconnected');
      this.isConnected = false;
      
      // Attempt to reconnect in production
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('📡 MongoDB reconnected');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // nodemon restart
  }

  /**
   * Graceful shutdown of database connection
   */
  async gracefulShutdown(signal) {
    console.log(`\n🔄 Received ${signal}. Gracefully shutting down database...`);
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      this.isConnected = false;
      
      if (signal === 'SIGUSR2') {
        process.kill(process.pid, 'SIGUSR2');
      } else {
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Check database connection status
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get database connection info
   */
  getConnectionInfo() {
    if (!this.isConnected || !mongoose.connection) {
      return {
        connected: false,
        status: 'disconnected'
      };
    }

    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      4: 'invalid'
    };

    return {
      connected: this.isConnected,
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections),
      readyState: mongoose.connection.readyState
    };
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    try {
      console.log('🔄 Creating database indexes...');
      
      // Import models to ensure indexes are created
      require('../models/User');
      
      // Wait for indexes to be built
      await new Promise(resolve => {
        mongoose.connection.on('index', () => {
          console.log('📊 Database index created');
        });
        
        // Give some time for indexes to be created
        setTimeout(resolve, 2000);
      });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
    }
  }

  /**
   * Drop database (for testing/development)
   */
  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }
    
    try {
      await mongoose.connection.dropDatabase();
      console.log('🗑️  Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        return { error: 'Database not connected' };
      }

      const stats = await mongoose.connection.db.stats();
      
      return {
        database: mongoose.connection.name,
        collections: stats.collections,
        documents: stats.objects,
        dataSize: this.formatBytes(stats.dataSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexes: stats.indexes,
        indexSize: this.formatBytes(stats.indexSize),
        avgObjSize: stats.avgObjSize,
        uptime: stats.ok === 1 ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Export singleton instance
const databaseManager = new DatabaseManager();

module.exports = {
  connect: () => databaseManager.connect(),
  disconnect: () => databaseManager.gracefulShutdown('manual'),
  isHealthy: () => databaseManager.isHealthy(),
  getConnectionInfo: () => databaseManager.getConnectionInfo(),
  createIndexes: () => databaseManager.createIndexes(),
  dropDatabase: () => databaseManager.dropDatabase(),
  getStats: () => databaseManager.getStats(),
  mongoose
};