require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Import services and routes
const database = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const steamRoutes = require('./routes/steamRoutes');
const steamService = require('./services/steamService');

/**
 * Production-ready Express server for SteamPipe platform
 * Integrates Steam accounts with Solana wallets for CS:GO skin trading
 */

class SteamPipeServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.steampowered.com", "https://steamcommunity.com"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // Compression
    this.app.use(compression());

    // Logging
    if (this.isDevelopment) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.isDevelopment ? 1000 : 100, // Limit each IP
      message: {
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // CORS configuration
    const corsOptions = {
      origin: this.getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session configuration
    this.setupSessions();

    // Request logging for development
    if (this.isDevelopment) {
      this.app.use((req, res, next) => {
        console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
        if (req.body && Object.keys(req.body).length > 0) {
          console.log('📦 Body:', JSON.stringify(req.body, null, 2));
        }
        next();
      });
    }
  }

  /**
   * Setup session management
   */
  setupSessions() {
    const sessionConfig = {
      secret: process.env.SESSION_SECRET || 'steampipe-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: !this.isDevelopment,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: this.isDevelopment ? 'lax' : 'strict'
      },
      name: 'steampipe.sid'
    };

    // Use MongoDB for session storage if available
    if (process.env.MONGODB_URI) {
      sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600, // lazy session update
        ttl: 24 * 60 * 60 // 24 hours
      });
    }

    this.app.use(session(sessionConfig));
  }

  /**
   * Get CORS origins from environment
   */
  getCorsOrigins() {
    const origins = process.env.CORS_ORIGIN?.split(',') || [];
    
    if (this.isDevelopment) {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      );
    }
    
    return origins.length > 0 ? origins : true;
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: database.isHealthy(),
        steam: {
          configured: !!process.env.STEAM_API_KEY,
          operational: false
        },
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      };

      // Check Steam service status
      try {
        const steamStatus = await steamService.getServiceStatus();
        health.steam.operational = steamStatus.status === 'operational';
      } catch (error) {
        health.steam.operational = false;
      }

      const statusCode = health.database && health.steam.operational ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Database info endpoint
    this.app.get('/api/database/info', async (req, res) => {
      try {
        const [connectionInfo, stats] = await Promise.all([
          database.getConnectionInfo(),
          database.getStats()
        ]);

        res.json({
          success: true,
          data: {
            connection: connectionInfo,
            stats: stats
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Authentication routes (wallet-first)
    this.app.use('/api/auth', authRoutes);
    
    // Steam API routes
    this.app.use('/api/steam', steamRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'SteamPipe API',
        version: '1.0.0',
        description: 'Steam CS:GO skin NFT trading platform backend',
        endpoints: {
          health: '/health',
          steam: '/api/steam',
          database: '/api/database/info'
        },
        documentation: 'https://github.com/your-repo/steampipe-api'
      });
    });

    // Steam OpenID legacy endpoints (for backward compatibility)
    this.app.get('/api/auth/steam', (req, res) => {
      res.redirect(`/api/steam/auth?${new URLSearchParams(req.query)}`);
    });

    this.app.get('/api/auth/steam/return', (req, res) => {
      res.redirect(`/api/steam/auth/callback?${new URLSearchParams(req.query)}`);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('💥 Server Error:', error);

      // Don't leak error details in production
      const errorResponse = {
        success: false,
        error: this.isDevelopment ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      };

      if (this.isDevelopment) {
        errorResponse.stack = error.stack;
        errorResponse.path = req.path;
        errorResponse.method = req.method;
      }

      const statusCode = error.statusCode || error.status || 500;
      res.status(statusCode).json(errorResponse);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      console.log('🚀 Starting SteamPipe server...');
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Connect to database
      try {
        await database.connect();
        await database.createIndexes();
        console.log('✅ Database initialization complete');
      } catch (error) {
        console.warn('⚠️  Database connection failed, continuing without database');
        console.warn('💡 Some features may be limited');
      }

      // Validate Steam API configuration
      if (!process.env.STEAM_API_KEY) {
        console.warn('⚠️  STEAM_API_KEY not configured');
        console.warn('💡 Steam features will be limited');
      } else {
        console.log('✅ Steam API key configured');
      }

      // Start HTTP server
      this.server = this.app.listen(this.port, () => {
        console.log('🎉 SteamPipe server started successfully!');
        console.log(`📍 Server running on port ${this.port}`);
        console.log(`🌐 Health check: http://localhost:${this.port}/health`);
        console.log(`📖 API docs: http://localhost:${this.port}/`);
        
        if (this.isDevelopment) {
          console.log('🔧 Development mode active');
          console.log('🔄 Hot reload enabled');
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      console.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    console.log(`\n🔄 Received ${signal}. Gracefully shutting down server...`);

    if (this.server) {
      this.server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await database.disconnect();
          console.log('✅ Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database:', error);
        }
        
        console.log('👋 Server shutdown complete');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new SteamPipeServer();
  server.start();
}

module.exports = SteamPipeServer;