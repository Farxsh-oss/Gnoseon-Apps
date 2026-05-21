import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'gnoseon-server.db');

class ServerDatabaseService {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode=WAL');
    this.db.exec('PRAGMA foreign_keys=ON');
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        displayName TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        status TEXT DEFAULT 'offline',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLogin DATETIME
      );

      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        avatar TEXT,
        createdBy TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT,
        groupId TEXT,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        isRead INTEGER DEFAULT 0,
        type TEXT DEFAULT 'text',
        expiresAt DATETIME,
        isEncrypted INTEGER DEFAULT 0,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id),
        FOREIGN KEY (groupId) REFERENCES groups (id)
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        userId1 TEXT,
        userId2 TEXT,
        groupId TEXT,
        lastMessage TEXT,
        lastMessageTime DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'private',
        FOREIGN KEY (userId1) REFERENCES users (id),
        FOREIGN KEY (userId2) REFERENCES users (id),
        FOREIGN KEY (groupId) REFERENCES groups (id)
      );

      CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        addedBy TEXT NOT NULL,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE(groupId, userId)
      );

      CREATE TABLE IF NOT EXISTS group_settings (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        isPublic INTEGER DEFAULT 0,
        allowInvites INTEGER DEFAULT 1,
        messageRetention INTEGER DEFAULT 0,
        allowFileSharing INTEGER DEFAULT 1,
        requireApproval INTEGER DEFAULT 0,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        UNIQUE(groupId)
      );

      CREATE TABLE IF NOT EXISTS shared_files (
        id TEXT PRIMARY KEY,
        fileName TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        fileType TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadedBy TEXT NOT NULL,
        chatId TEXT,
        groupId TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploadedBy) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        emoji TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (messageId) REFERENCES messages (id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE(messageId, userId, emoji)
      );
    `);

    this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser() {
    const existing = this.getUserByUsername('Farxsh');
    if (!existing) {
      await this.createUser('Farxsh', 'Badboy0254h!@', 'Administrator');
    }
  }

  async createUser(username: string, password: string, displayName?: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO users (id, username, password, displayName, avatar, bio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, displayName || username, '/src/assets/contacts.png', null, 'offline');
    return this.getUserById(id)!;
  }

  getUserByUsername(username: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return undefined;
    return { ...row, createdAt: new Date(row.createdAt), lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined };
  }

  getUserById(id: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, createdAt: new Date(row.createdAt), lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined };
  }

  async validateUser(username: string, password: string): Promise<any | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    this.db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    return this.getUserById(user.id)!;
  }

  getAllUsers(): any[] {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY displayName').all() as any[];
    return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt), lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined }));
  }

  createMessage(senderId: string, receiverId: string, text: string, groupId?: string, type: 'text' | 'file' | 'system' = 'text', expiresAt?: Date): any {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO messages (id, senderId, receiverId, groupId, text, type, expiresAt, isEncrypted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, senderId, receiverId || null, groupId || null, text, type, expiresAt ? expiresAt.toISOString() : null, 0);

    const message = this.getMessageById(id)!;
    if (groupId) this.updateGroupChatLastMessage(groupId, text);
    else if (receiverId) this.updateChatLastMessage(senderId, receiverId, text);
    return message;
  }

  getMessageById(id: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, timestamp: new Date(row.timestamp), isRead: Boolean(row.isRead), type: row.type || 'text', expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined, isEncrypted: Boolean(row.isEncrypted) };
  }

  addReaction(messageId: string, userId: string, emoji: string): boolean {
    try {
      this.db.prepare('INSERT OR IGNORE INTO message_reactions (id, messageId, userId, emoji) VALUES (?, ?, ?, ?)').run(uuidv4(), messageId, userId, emoji);
      return true;
    } catch { return false; }
  }

  removeReaction(messageId: string, userId: string, emoji: string): boolean {
    try {
      this.db.prepare('DELETE FROM message_reactions WHERE messageId = ? AND userId = ? AND emoji = ?').run(messageId, userId, emoji);
      return true;
    } catch { return false; }
  }

  getReactionsForMessage(messageId: string): Record<string, Array<{ userId: string; userName: string }>> {
    const rows = this.db.prepare(`
      SELECT r.emoji, r.userId, u.displayName AS userName
      FROM message_reactions r
      JOIN users u ON u.id = r.userId
      WHERE r.messageId = ?
      ORDER BY r.createdAt ASC
    `).all(messageId) as any[];
    return rows.reduce<Record<string, Array<{ userId: string; userName: string }>>>((acc, row) => {
      const list = acc[row.emoji] ?? [];
      list.push({ userId: row.userId, userName: row.userName });
      acc[row.emoji] = list;
      return acc;
    }, {});
  }

  getMessagesBetweenUsers(userId1: string, userId2: string): any[] {
    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      ORDER BY timestamp ASC
    `).all(userId1, userId2, userId2, userId1) as any[];
    return rows.map(row => ({ ...row, timestamp: new Date(row.timestamp), isRead: Boolean(row.isRead), type: row.type || 'text', expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined, isEncrypted: Boolean(row.isEncrypted) }));
  }

  getChatsForUser(userId: string): any[] {
    const rows = this.db.prepare(`
      SELECT c.*,
             CASE WHEN c.groupId IS NOT NULL THEN g.name WHEN c.userId1 = ? THEN u2.displayName ELSE u1.displayName END as displayName,
             CASE WHEN c.groupId IS NOT NULL THEN g.avatar WHEN c.userId1 = ? THEN u2.avatar ELSE u1.avatar END as displayAvatar,
             CASE WHEN c.groupId IS NOT NULL THEN (SELECT COUNT(*) FROM group_members WHERE groupId = c.groupId) ELSE NULL END as memberCount
      FROM chats c
      LEFT JOIN groups g ON c.groupId = g.id
      LEFT JOIN users u1 ON c.userId1 = u1.id
      LEFT JOIN users u2 ON c.userId2 = u2.id
      LEFT JOIN group_members gm ON c.groupId = gm.groupId AND gm.userId = ?
      WHERE (c.userId1 = ? OR c.userId2 = ? OR gm.userId = ?)
      ORDER BY c.lastMessageTime DESC, c.createdAt DESC
    `).all(userId, userId, userId, userId, userId, userId) as any[];
    return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt), lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined }));
  }

  private updateChatLastMessage(userId1: string, userId2: string, lastMessage: string) {
    const chat = this.getChatForUsers(userId1, userId2);
    if (!chat) {
      this.db.prepare('INSERT INTO chats (id, userId1, userId2, lastMessage, lastMessageTime) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').run(uuidv4(), userId1, userId2, lastMessage);
    } else {
      this.db.prepare('UPDATE chats SET lastMessage = ?, lastMessageTime = CURRENT_TIMESTAMP WHERE id = ?').run(lastMessage, chat.id);
    }
  }

  getChatForUsers(userId1: string, userId2: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM chats WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)').get(userId1, userId2, userId2, userId1) as any;
    if (!row) return undefined;
    return { ...row, createdAt: new Date(row.createdAt), lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined };
  }

  markMessagesAsRead(senderId: string, receiverId: string) {
    this.db.prepare('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ? AND isRead = 0').run(senderId, receiverId);
  }

  createGroup(name: string, description: string, createdBy: string): any {
    const id = uuidv4();
    this.db.prepare('INSERT INTO groups (id, name, description, createdBy) VALUES (?, ?, ?, ?)').run(id, name, description, createdBy);
    this.addGroupMember(id, createdBy, createdBy, 'admin');
    this.createGroupSettings(id);
    return this.getGroupById(id)!;
  }

  getGroupById(id: string): any | undefined {
    const row = this.db.prepare(`
      SELECT g.*, COUNT(gm.userId) as memberCount
      FROM groups g LEFT JOIN group_members gm ON g.id = gm.groupId
      WHERE g.id = ? GROUP BY g.id
    `).get(id) as any;
    if (!row) return undefined;
    return { ...row, createdAt: new Date(row.createdAt), members: this.getGroupMembers(id), settings: this.getGroupSettings(id)! };
  }

  getGroupsForUser(userId: string): any[] {
    const rows = this.db.prepare(`
      SELECT g.*, COUNT(gm.userId) as memberCount
      FROM groups g JOIN group_members gm ON g.id = gm.groupId
      WHERE gm.userId = ? GROUP BY g.id ORDER BY g.name
    `).all(userId) as any[];
    return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt), members: this.getGroupMembers(row.id), settings: this.getGroupSettings(row.id)! }));
  }

  addGroupMember(groupId: string, userId: string, addedBy: string, role: 'admin' | 'member' = 'member'): boolean {
    try {
      this.db.prepare('INSERT OR IGNORE INTO group_members (id, groupId, userId, role, addedBy) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), groupId, userId, role, addedBy);
      return true;
    } catch { return false; }
  }

  getGroupMembers(groupId: string): any[] {
    const rows = this.db.prepare('SELECT * FROM group_members WHERE groupId = ? ORDER BY joinedAt').all(groupId) as any[];
    return rows.map(row => ({ ...row, joinedAt: new Date(row.joinedAt) }));
  }

  createGroupSettings(groupId: string): any {
    this.db.prepare('INSERT OR IGNORE INTO group_settings (id, groupId) VALUES (?, ?)').run(uuidv4(), groupId);
    return this.getGroupSettings(groupId)!;
  }

  getGroupSettings(groupId: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM group_settings WHERE groupId = ?').get(groupId) as any;
    if (!row) return undefined;
    return { isPublic: Boolean(row.isPublic), allowInvites: Boolean(row.allowInvites), messageRetention: row.messageRetention, allowFileSharing: Boolean(row.allowFileSharing), requireApproval: Boolean(row.requireApproval) };
  }

  getMessagesForGroup(groupId: string): any[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE groupId = ? ORDER BY timestamp ASC').all(groupId) as any[];
    return rows.map(row => ({ ...row, timestamp: new Date(row.timestamp), isRead: Boolean(row.isRead), expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined, isEncrypted: Boolean(row.isEncrypted) }));
  }

  updateGroupChatLastMessage(groupId: string, lastMessage: string) {
    const chat = this.getGroupChat(groupId);
    if (!chat) {
      this.db.prepare("INSERT INTO chats (id, groupId, lastMessage, lastMessageTime, type) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'group')").run(uuidv4(), groupId, lastMessage);
    } else {
      this.db.prepare('UPDATE chats SET lastMessage = ?, lastMessageTime = CURRENT_TIMESTAMP WHERE id = ?').run(lastMessage, chat.id);
    }
  }

  getGroupChat(groupId: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM chats WHERE groupId = ?').get(groupId) as any;
    if (!row) return undefined;
    return { ...row, createdAt: new Date(row.createdAt), lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined };
  }

  async updateUserProfile(userId: string, updates: { bio?: string; status?: string }): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      if (updates.bio !== undefined) { fields.push('bio = ?'); values.push(updates.bio); }
      if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
      if (fields.length === 0) return true;
      this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values, userId);
      return true;
    } catch { return false; }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      this.db.prepare('DELETE FROM messages WHERE senderId = ? OR receiverId = ?').run(userId, userId);
      this.db.prepare('DELETE FROM chats WHERE userId1 = ? OR userId2 = ?').run(userId, userId);
      this.db.prepare('DELETE FROM group_members WHERE userId = ? OR addedBy = ?').run(userId, userId);
      const groups = this.db.prepare('SELECT id FROM groups WHERE createdBy = ?').all(userId) as any[];
      for (const g of groups) {
        this.db.prepare('DELETE FROM messages WHERE groupId = ?').run(g.id);
        this.db.prepare('DELETE FROM group_members WHERE groupId = ?').run(g.id);
        this.db.prepare('DELETE FROM group_settings WHERE groupId = ?').run(g.id);
        this.db.prepare('DELETE FROM chats WHERE groupId = ?').run(g.id);
        this.db.prepare('DELETE FROM groups WHERE id = ?').run(g.id);
      }
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      return true;
    } catch { return false; }
  }

  createSharedFile(fileName: string, fileSize: number, fileType: string, filePath: string, uploadedBy: string, chatId?: string, groupId?: string): any {
    const id = uuidv4();
    this.db.prepare('INSERT INTO shared_files (id, fileName, fileSize, fileType, filePath, uploadedBy, chatId, groupId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, fileName, fileSize, fileType, filePath, uploadedBy, chatId || null, groupId || null);
    return this.getFileById(id)!;
  }

  getFileById(id: string): any | undefined {
    const row = this.db.prepare('SELECT * FROM shared_files WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, uploadedAt: new Date(row.uploadedAt) };
  }

  getFilesForChat(chatId: string): any[] {
    const rows = this.db.prepare('SELECT * FROM shared_files WHERE chatId = ? ORDER BY uploadedAt DESC').all(chatId) as any[];
    return rows.map(row => ({ ...row, uploadedAt: new Date(row.uploadedAt) }));
  }

  getFilesForGroup(groupId: string): any[] {
    const rows = this.db.prepare('SELECT * FROM shared_files WHERE groupId = ? ORDER BY uploadedAt DESC').all(groupId) as any[];
    return rows.map(row => ({ ...row, uploadedAt: new Date(row.uploadedAt) }));
  }

  deleteFile(fileId: string): boolean {
    try { this.db.prepare('DELETE FROM shared_files WHERE id = ?').run(fileId); return true; }
    catch { return false; }
  }

  searchMessages(query: string, userId?: string): any[] {
    try {
      const like = `%${query}%`;
      let rows: any[];
      if (userId) {
        rows = this.db.prepare(`
          SELECT m.*, u1.displayName as senderName, u1.avatar as senderAvatar,
                 u2.displayName as receiverName, u2.avatar as receiverAvatar, g.name as groupName
          FROM messages m
          LEFT JOIN users u1 ON m.senderId = u1.id
          LEFT JOIN users u2 ON m.receiverId = u2.id
          LEFT JOIN groups g ON m.groupId = g.id
          WHERE (m.senderId = ? OR m.receiverId = ? OR m.groupId IN (
            SELECT groupId FROM group_members WHERE userId = ?
          )) AND m.text LIKE ?
          ORDER BY m.timestamp DESC LIMIT 100
        `).all(userId, userId, userId, like) as any[];
      } else {
        rows = this.db.prepare(`
          SELECT m.*, u1.displayName as senderName, u1.avatar as senderAvatar,
                 u2.displayName as receiverName, u2.avatar as receiverAvatar, g.name as groupName
          FROM messages m
          LEFT JOIN users u1 ON m.senderId = u1.id
          LEFT JOIN users u2 ON m.receiverId = u2.id
          LEFT JOIN groups g ON m.groupId = g.id
          WHERE m.text LIKE ?
          ORDER BY m.timestamp DESC LIMIT 100
        `).all(like) as any[];
      }
      return rows.map(row => ({ ...row, timestamp: new Date(row.timestamp), isRead: Boolean(row.isRead), type: row.type || 'text', expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined, isEncrypted: Boolean(row.isEncrypted) }));
    } catch { return []; }
  }

  deleteExpiredMessages(): number {
    try {
      const result = this.db.prepare("DELETE FROM messages WHERE expiresAt IS NOT NULL AND expiresAt < datetime('now')").run() as any;
      return result.changes ?? 0;
    } catch { return 0; }
  }

  close() {
    this.db.close();
  }
}

export { ServerDatabaseService };
