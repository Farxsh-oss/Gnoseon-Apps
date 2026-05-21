import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import { ServerDatabaseService } from './database/server-database.js';
import { authenticateSocket, generateToken } from './middleware/auth.js';
import { handleSocketEvents } from './socket/socketHandlers.js';
import { cacheMiddleware } from './middleware/cache.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { asyncQueueService } from './middleware/asyncQueue.js';
import { MessageCleanupService } from './cleanup/messageCleanup.js';
import { logger, logRequest, logError, logAuth, logSystem, logSocket } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL?.split(',') || ['*']
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:2000', 'http://localhost:2001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Middleware for structured logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });
  next();
});

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: any, _file: any, cb: any) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Middleware
app.use(cors({
  origin: isDevelopment 
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:2000', 'http://localhost:2001'] 
    : (process.env.FRONTEND_URL?.split(',') || ['*']),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', rateLimitMiddleware({
  limit: 100, // 100 requests per 15 minutes
  windowMs: 900000, // 15 minutes
  message: 'Mohon tunggu sebentar, terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.'
}));

// Apply caching to GET requests
app.use('/api/', cacheMiddleware(300000)); // 5 minutes cache

// Serve static files in production
if (!isDevelopment) {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize database
const db = new ServerDatabaseService();

// Initialize message cleanup service
const messageCleanupService = new MessageCleanupService(db);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/metrics', (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: io.engine.clientsCount,
    nodeVersion: process.version,
    platform: process.platform
  };
  res.json(metrics);
});

// LM Studio API endpoint - mock response (bot disabled in production)
app.post('/api/bot/chat', async (req, res) => {
  try {
    const { message, contactId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // In production, return informative message that bot is disabled
    // In development, show demo mode
    const response = {
      id: `bot-response-${Date.now()}`,
      senderId: 'gnoseon-bot',
      text: isDevelopment 
        ? `Demo response untuk: "${message}". Koneksi ke LM Studio tersedia di development mode.`
        : 'Bot AI sedang dalam mode maintenance. Silakan hubungi pengguna secara langsung untuk bantuan.',
      timestamp: new Date(),
      type: 'text'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Bot API error:', error);
    res.status(500).json({ 
      error: 'Failed to process bot request',
      message: 'Terjadi kesalahan saat memproses permintaan bot'
    });
  }
});

// Queue status endpoint
app.get('/api/queue/status', (req, res) => {
  try {
    const status = asyncQueueService.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await db.validateUser(username, password);
    if (!user) {
      logAuth('login', username, false, { reason: 'Invalid credentials' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user status to online
    await db.updateUserProfile(user.id, { status: 'online' });

    // Generate JWT token
    const token = generateToken(user.id);

    logAuth('login', user.id, true);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        status: 'online'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = await db.createUser(username, password, displayName);
    
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        status: 'offline'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      await db.updateUserProfile(userId, { status: 'offline' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/users', (req, res) => {
  try {
    const users = db.getAllUsers().map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      memberSince: user.createdAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      memberSince: user.createdAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { bio, status } = req.body;
    const userId = req.params.id;
    
    const success = await db.updateUserProfile(userId, { bio, status });
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to update profile' });
    }

    const updatedUser = db.getUserById(userId);
    res.json({
      id: updatedUser!.id,
      username: updatedUser!.username,
      displayName: updatedUser!.displayName,
      avatar: updatedUser!.avatar,
      bio: updatedUser!.bio,
      status: updatedUser!.status
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat routes
app.get('/api/chats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const chats = db.getChatsForUser(userId);
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/:userId1/:userId2', (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = db.getMessagesBetweenUsers(userId1, userId2);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/search', (req, res) => {
  try {
    const { q, userId } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const messages = db.searchMessages(q as string, userId as string);
    res.json(messages);
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Group routes
app.get('/api/groups/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const groups = db.getGroupsForUser(userId);
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId/messages', (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = db.getMessagesForGroup(groupId);
    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { chatId, groupId, uploadedBy } = req.body;

    if (!uploadedBy) {
      return res.status(400).json({ error: 'uploadedBy is required' });
    }

    const file = db.createSharedFile(
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      req.file.path,
      uploadedBy,
      chatId,
      groupId
    );

    res.json(file);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File download endpoint
app.get('/api/files/:fileId/download', (req, res) => {
  try {
    const { fileId } = req.params;
    const file = db.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(file.filePath, file.fileName);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file endpoint
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = db.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete from database
    const success = db.deleteFile(fileId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get files for chat
app.get('/api/files/chat/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const files = db.getFilesForChat(chatId);
    res.json(files);
  } catch (error) {
    console.error('Get chat files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get files for group
app.get('/api/files/group/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const files = db.getFilesForGroup(groupId);
    res.json(files);
  } catch (error) {
    console.error('Get group files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({ error: 'Name and createdBy are required' });
    }

    const group = db.createGroup(name, description, createdBy);
    res.json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  logSocket('connection', socket.id, socket.data.user.id);
  
  // Handle all socket events
  handleSocketEvents(socket, io, db);
  
  socket.on('disconnect', () => {
    logSocket('disconnect', socket.id, socket.data.user.id);
    
    // Update user status to offline
    db.updateUserProfile(socket.data.user.id, { status: 'offline' });
    
    // Notify other users that this user is offline
    socket.broadcast.emit('user_status_changed', {
      userId: socket.data.user.id,
      status: 'offline'
    });
  });
});

// Serve React app in production
if (!isDevelopment) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError(err, req);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  logSystem('server_start', { port: PORT, environment: process.env.NODE_ENV || 'development' });
  
  // Start message cleanup service
  messageCleanupService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logSystem('shutdown_signal', { signal: 'SIGTERM' });
  messageCleanupService.stop();
  server.close(() => {
    logSystem('server_closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logSystem('shutdown_signal', { signal: 'SIGINT' });
  messageCleanupService.stop();
  server.close(() => {
    logSystem('server_closed');
    process.exit(0);
  });
});

export { app, io, db };
