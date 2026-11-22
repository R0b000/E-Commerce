require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { config } = require('./Shared/API/config/config');
const { connectDatabase } = require('./Shared/API/config/Database.config');
const { authRouter } = require('./auth.server/controllers/AuthController');
const { ecommerceRouter } = require('./ecommerce.server/controllers/EcommerceRouter');
const { UploadService } = require('./ecommerce.server/services/UploadService');

const app = express();
const PORT = config.port || process.env.PORT || 5001;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(
  cors({
    origin: config.clientURL,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  skip: (req) =>
    config.nodeEnv === 'development' ||
    req.ip === '127.0.0.1' ||
    req.ip === '::1' ||
    req.ip === '::ffff:127.0.0.1',
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Himalaya Online Shop API Server is running',
    timestamp: new Date().toISOString(),
  });
});

const path = require('path');
const { auditLogMiddleware } = require('./ecommerce.server/middleware/auditMiddleware');

// User Activity Audit Logger Middleware
app.use(auditLogMiddleware);

// Use AuthRouter in case of auth routes 
app.use('/api/auth', authRouter);
app.use('/api/ecommerce', ecommerceRouter);

const fs = require('fs');
const distPath = path.join(__dirname, 'dist');

// Serve static assets if the build folder exists
if (fs.existsSync(distPath)) {
  console.log('[Server] Serving static assets from /dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('[Server] Warning: /dist folder not found. Static asset serving is disabled.');
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error(`[Error] ${new Date().toISOString()}:`, err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: [err.message],
  });
});

const http = require('http');
const { initSocket } = require('./ecommerce.server/socket/SocketServer');

const server = http.createServer(app);
initSocket(server, config.clientURL);

const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server Running on port ${PORT} (with Socket.IO support)`);
      console.log(`Server Environment: ${config.nodeEnv}`);

      // Schedule automated 24-hour cleanup for HimalayaOnlineShop/Temporary staging uploads
      const uploadService = new UploadService();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      setTimeout(() => {
        uploadService.cleanupTemporaryUploads(24).catch((err) =>
          console.error('[UploadService] Startup cleanup notice:', err.message)
        );
      }, 15000);
      setInterval(() => {
        uploadService.cleanupTemporaryUploads(24).catch((err) =>
          console.error('[UploadService] Scheduled cleanup notice:', err.message)
        );
      }, TWELVE_HOURS);
    });
  } catch (error) {
    console.error('Server Failed to connect to database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.server = server;
module.exports.startServer = startServer;