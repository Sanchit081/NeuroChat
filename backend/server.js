const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const messageRoutes = require('./src/routes/messages');
const { authenticateSocket, handleConnection } = require('./src/socket/socketHandlers');

const app = express();
let server = null;
let io = null;

// -----------------------------
// Allowed frontend URLs (full URLs)
// -----------------------------
const CLIENT_URLS = [
  process.env.CLIENT_URL,                  // From Render env vars
  'https://neuro-chat-rho.vercel.app',     // Production Vercel domain
  'http://localhost:3000'                  // Local dev
].filter(Boolean);

// -----------------------------
// Debug log for CORS
// -----------------------------
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} | Origin: ${req.header('Origin') || 'N/A'}`);
  next();
});

// -----------------------------
// Universal CORS handler
// -----------------------------
app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (origin && CLIENT_URLS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    console.warn(`❌ Blocked CORS origin: ${origin}`);
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
  windowMs: 15 * 60 * 1000,
  max: 1000,
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
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// -----------------------------
// API 404 handler
// -----------------------------
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// -----------------------------
// Serve frontend in production
// -----------------------------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// -----------------------------
// Error handling
// -----------------------------
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
});

// -----------------------------
// Create HTTP + Socket server
// -----------------------------
function createServerInstance() {
  const s = http.createServer(app);

  const socket = socketIo(s, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || CLIENT_URLS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`❌ Not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    }
  });

  socket.use(authenticateSocket);
  socket.on('connection', (clientSocket) => handleConnection(clientSocket));

  return { s, socket };
}

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;
const { s, socket } = createServerInstance();
s.listen(PORT, () => {
  server = s;
  io = socket;
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO allowed origins: ${CLIENT_URLS.join(', ')}`);
  console.log(`🔗 API base URL: ${process.env.NODE_ENV === 'production' ? 'Render Production' : 'Local Dev'}`);
});
