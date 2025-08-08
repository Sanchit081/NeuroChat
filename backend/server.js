const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const net = require('net');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const messageRoutes = require('./src/routes/messages');
const { authenticateSocket, handleConnection } = require('./src/socket/socketHandlers');

const app = express();
let server = null;
let io = null;

// -----------------------------
// Allowed frontend URLs
// -----------------------------
const CLIENT_URLS = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// -----------------------------
// Debug log for all requests (CORS troubleshooting)
// -----------------------------
app.use((req, res, next) => {
  console.log(req.method, req.url, 'Origin:', req.header('Origin'));
  next();
});

// -----------------------------
// Universal CORS handler - must be first
// -----------------------------
app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (CLIENT_URLS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// -----------------------------
// Security & rate limiting
// -----------------------------
app.use(helmet());
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 for development
  message: 'Too many requests from this IP, please try again later.'
}));

// -----------------------------
// Body parsing & static files
// -----------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// -----------------------------
// MongoDB connection
// -----------------------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message || err);
    process.exit(1);
  });

// -----------------------------
// Routes
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// -----------------------------
// Error handling
// -----------------------------
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
});
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// -----------------------------
// Create HTTP + Socket server
// -----------------------------
function createServerInstance() {
  const s = http.createServer(app);

  const socket = socketIo(s, {
    cors: {
      origin: CLIENT_URLS,
      credentials: true,
      methods: ['GET', 'POST'],
    }
  });

  socket.use(authenticateSocket);
  socket.on('connection', handleConnection(socket));

  return { s, socket };
}

// -----------------------------
// Port scanning helper
// -----------------------------
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.once('close', () => resolve(true)).close())
      .listen(port);
  });
}

// -----------------------------
// Auto-start on free port
// -----------------------------
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

(async function startServer() {
  let port = DEFAULT_PORT;

  while (!(await isPortFree(port))) {
    console.warn(`⚠️ Port ${port} in use. Trying ${port + 1}...`);
    port++;
  }

  const { s, socket } = createServerInstance();
  s.listen(port, () => {
    server = s;
    io = socket;
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Socket.IO ready (CORS origin(s): ${CLIENT_URLS.join(', ')})`);
    console.log(`🔗 API base URL: http://localhost:${port}`);
  });

  s.on('error', (err) => {
    console.error('Fatal server error:', err);
    process.exit(1);
  });
})();
