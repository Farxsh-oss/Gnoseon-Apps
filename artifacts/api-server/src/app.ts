import express, { type Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import pinoHttp from "pino-http";
import multer from "multer";
import fs from "fs";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { ServerDatabaseService } from "./server-database";
import { authenticateSocket, generateToken } from "./auth";
import { handleSocketEvents } from "./socketHandlers";
import { MessageCleanupService } from "./messageCleanup";
import bcrypt from "bcryptjs";

const app: Express = express();
const httpServer = createServer(app);

const isDevelopment = process.env.NODE_ENV !== "production";

export const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], credentials: true },
  path: "/api/socket.io",
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.use(cors({ origin: "*", credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadsDir),
  filename: (_req: any, file: any, cb: any) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_r: any, _f: any, cb: any) => cb(null, true) });

// Initialize database + cleanup
const db = new ServerDatabaseService();
const messageCleanupService = new MessageCleanupService(db);
messageCleanupService.start();

// Existing health router
app.use("/api", router);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime(), environment: process.env.NODE_ENV || "development" });
});

app.get("/api/metrics", (_req, res) => {
  res.json({ uptime: process.uptime(), memory: process.memoryUsage(), cpu: process.cpuUsage(), activeConnections: io.engine.clientsCount, nodeVersion: process.version });
});

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const user = await db.validateUser(username, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    await db.updateUserProfile(user.id, { status: "online" });
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, bio: user.bio, status: "online" } });
  } catch (error) { logger.error({ error }, "Login error"); res.status(500).json({ error: "Internal server error" }); }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const existingUser = db.getUserByUsername(username);
    if (existingUser) return res.status(409).json({ error: "Username already exists" });
    const user = await db.createUser(username, password, displayName);
    res.status(201).json({ user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, bio: user.bio, status: "offline" } });
  } catch (error) { logger.error({ error }, "Register error"); res.status(500).json({ error: "Internal server error" }); }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) await db.updateUserProfile(userId, { status: "offline" });
    res.json({ success: true });
  } catch (error) { logger.error({ error }, "Logout error"); res.status(500).json({ error: "Internal server error" }); }
});

// User routes
app.get("/api/users", (_req, res) => {
  try {
    const users = db.getAllUsers().map((u: any) => ({ id: u.id, username: u.username, displayName: u.displayName, avatar: u.avatar, bio: u.bio, status: u.status, memberSince: u.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short" }) }));
    res.json(users);
  } catch (error) { logger.error({ error }, "Get users error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/users/:id", (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, bio: user.bio, status: user.status, memberSince: user.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short" }) });
  } catch (error) { logger.error({ error }, "Get user error"); res.status(500).json({ error: "Internal server error" }); }
});

app.put("/api/users/:id/profile", async (req, res) => {
  try {
    const { bio, status } = req.body;
    const success = await db.updateUserProfile(req.params.id, { bio, status });
    if (!success) return res.status(400).json({ error: "Failed to update profile" });
    const u = db.getUserById(req.params.id);
    res.json({ id: u!.id, username: u!.username, displayName: u!.displayName, avatar: u!.avatar, bio: u!.bio, status: u!.status });
  } catch (error) { logger.error({ error }, "Update profile error"); res.status(500).json({ error: "Internal server error" }); }
});

app.delete("/api/users/:id/delete", async (req, res) => {
  try {
    const { password } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });
    const success = await db.deleteUser(req.params.id);
    if (!success) return res.status(500).json({ error: "Failed to delete account" });
    res.json({ success: true });
  } catch (error) { logger.error({ error }, "Delete user error"); res.status(500).json({ error: "Internal server error" }); }
});

// Chat routes
app.get("/api/chats/:userId", (req, res) => {
  try { res.json(db.getChatsForUser(req.params.userId)); }
  catch (error) { logger.error({ error }, "Get chats error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/messages/search", (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q) return res.status(400).json({ error: "Search query is required" });
    res.json(db.searchMessages(q as string, userId as string));
  } catch (error) { logger.error({ error }, "Search messages error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/messages/:userId1/:userId2", (req, res) => {
  try { res.json(db.getMessagesBetweenUsers(req.params.userId1, req.params.userId2)); }
  catch (error) { logger.error({ error }, "Get messages error"); res.status(500).json({ error: "Internal server error" }); }
});

// Group routes
app.get("/api/groups/:userId", (req, res) => {
  try { res.json(db.getGroupsForUser(req.params.userId)); }
  catch (error) { logger.error({ error }, "Get groups error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/groups/:groupId/messages", (req, res) => {
  try { res.json(db.getMessagesForGroup(req.params.groupId)); }
  catch (error) { logger.error({ error }, "Get group messages error"); res.status(500).json({ error: "Internal server error" }); }
});

app.post("/api/groups", async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    if (!name || !createdBy) return res.status(400).json({ error: "Name and createdBy are required" });
    res.json(db.createGroup(name, description, createdBy));
  } catch (error) { logger.error({ error }, "Create group error"); res.status(500).json({ error: "Internal server error" }); }
});

// File routes
app.post("/api/files/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { chatId, groupId, uploadedBy } = req.body;
    if (!uploadedBy) return res.status(400).json({ error: "uploadedBy is required" });
    res.json(db.createSharedFile(req.file.originalname, req.file.size, req.file.mimetype, req.file.path, uploadedBy, chatId, groupId));
  } catch (error) { logger.error({ error }, "File upload error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/files/:fileId/download", (req, res) => {
  try {
    const file = db.getFileById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (!fs.existsSync(file.filePath)) return res.status(404).json({ error: "File not found on disk" });
    res.download(file.filePath, file.fileName);
  } catch (error) { logger.error({ error }, "File download error"); res.status(500).json({ error: "Internal server error" }); }
});

app.delete("/api/files/:fileId", async (req, res) => {
  try {
    const file = db.getFileById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
    res.json({ success: db.deleteFile(req.params.fileId) });
  } catch (error) { logger.error({ error }, "Delete file error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/files/chat/:chatId", (req, res) => {
  try { res.json(db.getFilesForChat(req.params.chatId)); }
  catch (error) { logger.error({ error }, "Get chat files error"); res.status(500).json({ error: "Internal server error" }); }
});

app.get("/api/files/group/:groupId", (req, res) => {
  try { res.json(db.getFilesForGroup(req.params.groupId)); }
  catch (error) { logger.error({ error }, "Get group files error"); res.status(500).json({ error: "Internal server error" }); }
});

// Bot chat endpoint
app.post("/api/bot/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    res.json({
      id: `bot-response-${Date.now()}`,
      senderId: "gnoseon-bot",
      text: isDevelopment
        ? `Demo response untuk: "${message}". Koneksi ke LM Studio tersedia di development mode.`
        : "Bot AI sedang dalam mode maintenance. Silakan hubungi pengguna secara langsung untuk bantuan.",
      timestamp: new Date(),
      type: "text",
    });
  } catch (error) { logger.error({ error }, "Bot API error"); res.status(500).json({ error: "Failed to process bot request" }); }
});

// Socket.IO
io.use(authenticateSocket);
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id, userId: socket.data.user?.id }, "Socket connected");
  handleSocketEvents(socket as any, io, db);
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket disconnected");
    if (socket.data.user) {
      db.updateUserProfile(socket.data.user.id, { status: "offline" });
      socket.broadcast.emit("user_status_changed", { userId: socket.data.user.id, status: "offline" });
    }
  });
});

export { app, httpServer };
export default httpServer;
