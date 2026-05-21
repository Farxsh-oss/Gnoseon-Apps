import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { User, Message, Chat, Group, GroupMember, GroupSettings, MessageReport } from './database-types';

const dbPath = path.join(process.cwd(), 'data', 'gnoseon.db');

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
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
      
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT,
        groupId TEXT,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT 0,
        type TEXT DEFAULT 'text',
        expiresAt DATETIME,
        isEncrypted BOOLEAN DEFAULT 0,
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
        FOREIGN KEY (groupId) REFERENCES groups (id),
        CHECK ((userId1 IS NOT NULL AND userId2 IS NOT NULL AND groupId IS NULL) OR (groupId IS NOT NULL AND userId1 IS NULL AND userId2 IS NULL))
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
      
      CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        addedBy TEXT NOT NULL,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (addedBy) REFERENCES users (id),
        UNIQUE(groupId, userId)
      );
      
      CREATE TABLE IF NOT EXISTS group_settings (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        isPublic BOOLEAN DEFAULT 0,
        allowInvites BOOLEAN DEFAULT 1,
        messageRetention INTEGER DEFAULT 0,
        allowFileSharing BOOLEAN DEFAULT 1,
        requireApproval BOOLEAN DEFAULT 0,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        UNIQUE(groupId)
      );
      
      CREATE TABLE IF NOT EXISTS message_reports (
        id TEXT PRIMARY KEY,
        messageId TEXT NOT NULL,
        reportedBy TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (messageId) REFERENCES messages (id),
        FOREIGN KEY (reportedBy) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS shared_files (
        id TEXT PRIMARY KEY,
        messageId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        fileType TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (messageId) REFERENCES messages (id)
      );
      
      CREATE TABLE IF NOT EXISTS blocked_users (
        id TEXT PRIMARY KEY,
        blockerId TEXT NOT NULL,
        blockedId TEXT NOT NULL,
        blockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        FOREIGN KEY (blockerId) REFERENCES users (id),
        FOREIGN KEY (blockedId) REFERENCES users (id),
        UNIQUE(blockerId, blockedId)
      );
    `);
    
    // Create default admin user if it doesn't exist
    this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser() {
    const existingAdmin = this.getUserByUsername('Farxsh');
    if (!existingAdmin) {
      await this.createUser('Farxsh', 'Badboy0254h!@', 'Administrator');
    }
  }

  async createUser(username: string, password: string, displayName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password, displayName, avatar, bio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, username, hashedPassword, displayName || username, '/src/assets/contacts.png', null, 'offline');
    
    return this.getUserById(id)!;
  }

  getUserByUsername(username: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined
    };
  }

  getUserById(id: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined
    };
  }

  async updateUserProfile(userId: string, updates: { bio?: string; status?: string }): Promise<boolean> {
    try {
      const fields = [];
      const values = [];
      
      if (updates.bio !== undefined) {
        fields.push('bio = ?');
        values.push(updates.bio);
      }
      
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      
      if (fields.length === 0) return true;
      
      const stmt = this.db.prepare(`
        UPDATE users SET ${fields.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...values, userId);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    const stmt = this.db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(user.id);
    
    return this.getUserById(user.id)!;
  }

  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY displayName');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined
    }));
  }

  createMessage(senderId: string, receiverId: string, text: string, groupId?: string, type: 'text' | 'file' | 'system' = 'text', expiresAt?: Date): Message {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, senderId, receiverId, groupId, text, type, expiresAt, isEncrypted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, senderId, receiverId || null, groupId || null, text, type, expiresAt || null, 0);
    
    const message = this.getMessageById(id)!;
    
    if (groupId) {
      this.updateGroupChatLastMessage(groupId, text);
    } else if (receiverId) {
      this.updateChatLastMessage(senderId, receiverId, text);
    }
    
    return message;
  }

  getMessageById(id: string): Message | undefined {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      timestamp: new Date(row.timestamp),
      isRead: Boolean(row.isRead),
      type: row.type || 'text',
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      isEncrypted: Boolean(row.isEncrypted)
    };
  }

  getMessagesBetweenUsers(userId1: string, userId2: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(userId1, userId2, userId2, userId1) as any[];
    
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      isRead: Boolean(row.isRead),
      type: row.type || 'text',
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      isEncrypted: Boolean(row.isEncrypted)
    }));
  }

  getChatForUsers(userId1: string, userId2: string): Chat | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM chats 
      WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
    `);
    const row = stmt.get(userId1, userId2, userId2, userId1) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined
    };
  }

  getChatsForUser(userId: string): Chat[] {
    const stmt = this.db.prepare(`
      SELECT c.*, 
             CASE 
               WHEN c.groupId IS NOT NULL THEN g.name
               WHEN c.userId1 = ? THEN u2.displayName
               ELSE u1.displayName
             END as displayName,
             CASE 
               WHEN c.groupId IS NOT NULL THEN g.avatar
               WHEN c.userId1 = ? THEN u2.avatar
               ELSE u1.avatar
             END as displayAvatar,
             CASE 
               WHEN c.groupId IS NOT NULL THEN (SELECT COUNT(*) FROM group_members WHERE groupId = c.groupId)
               ELSE NULL
             END as memberCount
      FROM chats c
      LEFT JOIN groups g ON c.groupId = g.id
      LEFT JOIN users u1 ON c.userId1 = u1.id
      LEFT JOIN users u2 ON c.userId2 = u2.id
      LEFT JOIN group_members gm ON c.groupId = gm.groupId AND gm.userId = ?
      WHERE (c.userId1 = ? OR c.userId2 = ? OR gm.userId = ?)
      ORDER BY c.lastMessageTime DESC, c.createdAt DESC
    `);
    const rows = stmt.all(userId, userId, userId, userId, userId, userId) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined
    }));
  }

  private updateChatLastMessage(userId1: string, userId2: string, lastMessage: string) {
    let chat = this.getChatForUsers(userId1, userId2);
    
    if (!chat) {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO chats (id, userId1, userId2, lastMessage, lastMessageTime)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      stmt.run(id, userId1, userId2, lastMessage);
    } else {
      const stmt = this.db.prepare(`
        UPDATE chats SET lastMessage = ?, lastMessageTime = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(lastMessage, chat.id);
    }
  }

  markMessagesAsRead(senderId: string, receiverId: string) {
    const stmt = this.db.prepare(`
      UPDATE messages SET isRead = 1 
      WHERE senderId = ? AND receiverId = ? AND isRead = 0
    `);
    stmt.run(senderId, receiverId);
  }

  getUnreadMessageCount(userId: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE receiverId = ? AND isRead = 0
    `);
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  deleteMessage(messageId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(messageId);
    return result.changes > 0;
  }

  saveSharedFile(messageId: string, fileName: string, fileSize: number, fileType: string, filePath: string) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO shared_files (id, messageId, fileName, fileSize, fileType, filePath)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, messageId, fileName, fileSize, fileType, filePath);
    return this.getSharedFileById(id);
  }

  getSharedFileById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM shared_files WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      uploadedAt: new Date(row.uploadedAt)
    };
  }

  getSharedFilesForMessage(messageId: string) {
    const stmt = this.db.prepare('SELECT * FROM shared_files WHERE messageId = ? ORDER BY uploadedAt DESC');
    const rows = stmt.all(messageId) as any[];
    
    return rows.map(row => ({
      ...row,
      uploadedAt: new Date(row.uploadedAt)
    }));
  }

  getSharedFilesForUsers(userId1: string, userId2: string) {
    const stmt = this.db.prepare(`
      SELECT sf.* FROM shared_files sf
      JOIN messages m ON sf.messageId = m.id
      WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
      ORDER BY sf.uploadedAt DESC
    `);
    const rows = stmt.all(userId1, userId2, userId2, userId1) as any[];
    
    return rows.map(row => ({
      ...row,
      uploadedAt: new Date(row.uploadedAt)
    }));
  }

  deleteSharedFile(fileId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM shared_files WHERE id = ?');
    const result = stmt.run(fileId);
    return result.changes > 0;
  }

  clearChatHistory(userId1: string, userId2: string): boolean {
    try {
      // Delete messages between users
      const stmt = this.db.prepare(`
        DELETE FROM messages 
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      `);
      stmt.run(userId1, userId2, userId2, userId1);
      
      // Delete associated shared files
      const fileStmt = this.db.prepare(`
        DELETE FROM shared_files 
        WHERE messageId IN (
          SELECT id FROM messages 
          WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
        )
      `);
      fileStmt.run(userId1, userId2, userId2, userId1);
      
      // Update or delete chat entry
      const chatStmt = this.db.prepare(`
        DELETE FROM chats 
        WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
      `);
      chatStmt.run(userId1, userId2, userId2, userId1);
      
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  exportChatHistory(userId1: string, userId2: string): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        m.id,
        m.senderId,
        m.receiverId,
        m.text,
        m.timestamp,
        m.isRead,
        u1.displayName as senderName,
        u2.displayName as receiverName
      FROM messages m
      JOIN users u1 ON m.senderId = u1.id
      JOIN users u2 ON m.receiverId = u2.id
      WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
      ORDER BY m.timestamp ASC
    `);
    
    const rows = stmt.all(userId1, userId2, userId2, userId1) as any[];
    
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      isRead: Boolean(row.isRead)
    }));
  }

  blockUser(blockerId: string, blockedId: string, reason?: string): boolean {
    try {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO blocked_users (id, blockerId, blockedId, reason)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(id, blockerId, blockedId, reason || null);
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  unblockUser(blockerId: string, blockedId: string): boolean {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM blocked_users 
        WHERE blockerId = ? AND blockedId = ?
      `);
      const result = stmt.run(blockerId, blockedId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  isUserBlocked(blockerId: string, blockedId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM blocked_users 
      WHERE blockerId = ? AND blockedId = ?
    `);
    const result = stmt.get(blockerId, blockedId) as { count: number };
    return result.count > 0;
  }

  getBlockedUsers(userId: string): User[] {
    const stmt = this.db.prepare(`
      SELECT u.* FROM users u
      JOIN blocked_users bu ON u.id = bu.blockedId
      WHERE bu.blockerId = ?
      ORDER BY bu.blockedAt DESC
    `);
    const rows = stmt.all(userId) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined
    }));
  }

  close() {
    this.db.close();
  }

  // Group-related methods
  createGroup(name: string, description: string, createdBy: string): Group {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO groups (id, name, description, createdBy)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, description, createdBy);
    
    // Add creator as admin
    this.addGroupMember(id, createdBy, createdBy, 'admin');
    
    // Create default settings
    this.createGroupSettings(id);
    
    return this.getGroupById(id)!;
  }

  getGroupById(id: string): Group | undefined {
    const stmt = this.db.prepare(`
      SELECT g.*, COUNT(gm.userId) as memberCount
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.groupId
      WHERE g.id = ?
      GROUP BY g.id
    `);
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      members: this.getGroupMembers(id),
      settings: this.getGroupSettings(id)!
    };
  }

  getGroupsForUser(userId: string): Group[] {
    console.log('Getting groups for user:', userId);
    const stmt = this.db.prepare(`
      SELECT g.*, COUNT(gm.userId) as memberCount
      FROM groups g
      JOIN group_members gm ON g.id = gm.groupId
      WHERE gm.userId = ?
      GROUP BY g.id
      ORDER BY g.name
    `);
    const rows = stmt.all(userId) as any[];
    console.log('Groups query result:', rows);
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      members: this.getGroupMembers(row.id),
      settings: this.getGroupSettings(row.id)!
    }));
  }

  addGroupMember(groupId: string, userId: string, addedBy: string, role: 'admin' | 'member' = 'member'): boolean {
    try {
      console.log('Adding group member:', { groupId, userId, addedBy, role });
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO group_members (id, groupId, userId, role, addedBy)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(id, groupId, userId, role, addedBy);
      console.log('Successfully added group member');
      return true;
    } catch (error) {
      console.error('Error adding group member:', error);
      return false;
    }
  }

  removeGroupMember(groupId: string, userId: string): boolean {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM group_members 
        WHERE groupId = ? AND userId = ?
      `);
      const result = stmt.run(groupId, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error removing group member:', error);
      return false;
    }
  }

  getGroupMembers(groupId: string): GroupMember[] {
    const stmt = this.db.prepare(`
      SELECT * FROM group_members 
      WHERE groupId = ?
      ORDER BY joinedAt
    `);
    const rows = stmt.all(groupId) as any[];
    
    return rows.map(row => ({
      ...row,
      joinedAt: new Date(row.joinedAt)
    }));
  }

  createGroupSettings(groupId: string): GroupSettings {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO group_settings (id, groupId)
      VALUES (?, ?)
    `);
    stmt.run(id, groupId);
    return this.getGroupSettings(groupId)!;
  }

  getGroupSettings(groupId: string): GroupSettings | undefined {
    const stmt = this.db.prepare('SELECT * FROM group_settings WHERE groupId = ?');
    const row = stmt.get(groupId) as any;
    if (!row) return undefined;
    
    return {
      isPublic: Boolean(row.isPublic),
      allowInvites: Boolean(row.allowInvites),
      messageRetention: row.messageRetention,
      allowFileSharing: Boolean(row.allowFileSharing),
      requireApproval: Boolean(row.requireApproval)
    };
  }

  updateGroupSettings(groupId: string, settings: Partial<GroupSettings>): boolean {
    try {
      const fields = Object.keys(settings).filter(key => key !== 'id');
      const values = fields.map(field => settings[field as keyof GroupSettings]);
      
      if (fields.length === 0) return true;
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const stmt = this.db.prepare(`
        UPDATE group_settings 
        SET ${setClause}
        WHERE groupId = ?
      `);
      stmt.run(...values, groupId);
      return true;
    } catch (error) {
      console.error('Error updating group settings:', error);
      return false;
    }
  }

  getMessagesForGroup(groupId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE groupId = ?
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(groupId) as any[];
    
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      isRead: Boolean(row.isRead),
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      isEncrypted: Boolean(row.isEncrypted)
    }));
  }

  updateGroupChatLastMessage(groupId: string, lastMessage: string) {
    let chat = this.getGroupChat(groupId);
    
    if (!chat) {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO chats (id, groupId, lastMessage, lastMessageTime, type)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'group')
      `);
      stmt.run(id, groupId, lastMessage);
    } else {
      const stmt = this.db.prepare(`
        UPDATE chats SET lastMessage = ?, lastMessageTime = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(lastMessage, chat.id);
    }
  }

  getGroupChat(groupId: string): Chat | undefined {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE groupId = ?');
    const row = stmt.get(groupId) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      lastMessageTime: row.lastMessageTime ? new Date(row.lastMessageTime) : undefined
    };
  }

  // Message reporting
  reportMessage(messageId: string, reportedBy: string, reason: string): MessageReport {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO message_reports (id, messageId, reportedBy, reason)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, messageId, reportedBy, reason);
    return this.getMessageReportById(id)!;
  }

  getMessageReportById(id: string): MessageReport | undefined {
    const stmt = this.db.prepare('SELECT * FROM message_reports WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      timestamp: new Date(row.timestamp),
      status: row.status as 'pending' | 'reviewed' | 'resolved'
    };
  }

  // Encryption utilities
  encryptMessage(text: string): string {
    // Simple XOR encryption for demonstration (in production, use proper encryption)
    const key = 'gnoseon-encryption-key';
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  }

  decryptMessage(encryptedText: string): string {
    const key = 'gnoseon-encryption-key';
    let decrypted = '';
    const text = atob(encryptedText);
    for (let i = 0; i < text.length; i++) {
      decrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  // Message expiration cleanup
  cleanupExpiredMessages(): number {
    const stmt = this.db.prepare(`
      DELETE FROM messages 
      WHERE expiresAt IS NOT NULL AND expiresAt < CURRENT_TIMESTAMP
    `);
    const result = stmt.run();
    return result.changes;
  }
}

export { DatabaseService };
export const db = new DatabaseService();
