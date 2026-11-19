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

// Database One-Click Seeding Endpoint (No local mongo installation needed)
let seedDataFn;
try {
  seedDataFn = require('./seed').seedData;
} catch (e) {
  // seed.js will be loaded if available
}

app.get('/api/seed', async (req, res) => {
  const token = req.query.token;
  const validToken = process.env.DEPLOY_TOKEN || 'my_super_secret_deploy_token_123';
  if (!token || token !== validToken) {
    return res.status(403).json({ success: false, message: 'Forbidden: invalid or missing token' });
  }

  if (!seedDataFn) {
    try {
      seedDataFn = require('./seed').seedData;
    } catch (e) {
      return res.status(500).json({ success: false, message: 'seed.js module could not be loaded: ' + e.message });
    }
  }

  try {
    const result = await seedDataFn(false);
    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully with all Roles, Permissions, Categories, Products, and Admin!',
      admin: 'admin@store.com / admin123',
      seller: 'seller@store.com / seller123',
      customer: 'customer@store.com / customer123',
      result,
    });
  } catch (error) {
    console.error('Seeding error via API:', error);
    return res.status(500).json({
      success: false,
      message: 'Seeding error: ' + error.message,
    });
  }
});

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