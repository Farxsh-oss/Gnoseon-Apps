import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, Message, Chat } from './database-types';

class BrowserDatabaseService {
  private readonly USERS_KEY = 'gnoseon_users';
  private readonly MESSAGES_KEY = 'gnoseon_messages';
  private readonly CHATS_KEY = 'gnoseon_chats';
  private readonly BLOCKED_USERS_KEY = 'gnoseon_blocked_users';
  private readonly SHARED_FILES_KEY = 'gnoseon_shared_files';
  private readonly GROUPS_KEY = 'gnoseon_groups';
  private readonly GROUP_MEMBERS_KEY = 'gnoseon_group_members';

  constructor() {
    this.initStorage();
    this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser() {
    const existingAdmin = this.getUserByUsername('Farxsh');
    if (!existingAdmin) {
      await this.createUser('Farxsh', 'Badboy0254h!@', 'Administrator');
    }
  }

  private initStorage() {
    if (!localStorage.getItem(this.USERS_KEY)) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.MESSAGES_KEY)) {
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.CHATS_KEY)) {
      localStorage.setItem(this.CHATS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.BLOCKED_USERS_KEY)) {
      localStorage.setItem(this.BLOCKED_USERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.SHARED_FILES_KEY)) {
      localStorage.setItem(this.SHARED_FILES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.GROUPS_KEY)) {
      localStorage.setItem(this.GROUPS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.GROUP_MEMBERS_KEY)) {
      localStorage.setItem(this.GROUP_MEMBERS_KEY, JSON.stringify([]));
    }
  }

  private getUsers(): User[] {
    const data = localStorage.getItem(this.USERS_KEY);
    if (!data) return [];
    const users = JSON.parse(data);
    return users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    }));
  }

  private setUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private getMessages(): Message[] {
    const data = localStorage.getItem(this.MESSAGES_KEY);
    if (!data) return [];
    const messages = JSON.parse(data);
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  }

  private setMessages(messages: Message[]): void {
    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
  }

  private getChats(): Chat[] {
    const data = localStorage.getItem(this.CHATS_KEY);
    if (!data) return [];
    const chats = JSON.parse(data);
    return chats.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined
    }));
  }

  private setChats(chats: Chat[]): void {
    localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
  }

  async createUser(username: string, password: string, displayName?: string): Promise<User> {
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error(`User with username ${username} already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const newUser: User = {
      id,
      username,
      password: hashedPassword,
      displayName: displayName || username,
      createdAt: new Date(),
    };
    
    users.push(newUser);
    this.setUsers(users);
    
    return newUser;
  }

  getUserByUsername(username: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.username === username);
  }

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.id === id);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    const users = this.getUsers();
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, lastLogin: new Date() } : u
    );
    this.setUsers(updatedUsers);
    
    return { ...user, lastLogin: new Date() };
  }

  getAllUsers(): User[] {
    return this.getUsers();
  }

  createMessage(senderId: string, receiverId: string, text: string, groupId?: string, type: 'text' | 'file' | 'system' = 'text', expiresAt?: Date, isEncrypted: boolean = false): Message {
    const id = uuidv4();
    const newMessage: Message = {
      id,
      senderId,
      receiverId,
      groupId,
      text,
      timestamp: new Date(),
      isRead: false,
      type,
      expiresAt,
      isEncrypted,
    };
    
    const messages = this.getMessages();
    messages.push(newMessage);
    this.setMessages(messages);
    
    if (groupId) {
      // Update group chat last message (minimal implementation)
      this.updateChatLastMessage(senderId, receiverId, text);
    } else if (receiverId) {
      this.updateChatLastMessage(senderId, receiverId, text);
    }
    
    return newMessage;
  }

  getMessageById(id: string): Message | undefined {
    const messages = this.getMessages();
    return messages.find(msg => msg.id === id);
  }

  getMessagesBetweenUsers(userId1: string, userId2: string): Message[] {
    const messages = this.getMessages();
    return messages
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getChatForUsers(userId1: string, userId2: string): Chat | undefined {
    const chats = this.getChats();
    return chats.find(chat => 
      (chat.userId1 === userId1 && chat.userId2 === userId2) ||
      (chat.userId1 === userId2 && chat.userId2 === userId1)
    );
  }

  getChatsForUser(userId: string): Chat[] {
    const chats = this.getChats();
    return chats
      .filter(chat => chat.userId1 === userId || chat.userId2 === userId)
      .sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }

  private updateChatLastMessage(userId1: string, userId2: string, lastMessage: string) {
    let chat = this.getChatForUsers(userId1, userId2);
    const chats = this.getChats();
    
    if (!chat) {
      const newChat: Chat = {
        id: uuidv4(),
        userId1,
        userId2,
        lastMessage,
        lastMessageTime: new Date(),
        createdAt: new Date(),
        type: 'private',
      };
      chats.push(newChat);
    } else {
      const updatedChats = chats.map(c => 
        c.id === chat!.id 
          ? { ...c, lastMessage, lastMessageTime: new Date() }
          : c
      );
      this.setChats(updatedChats);
      return;
    }
    
    this.setChats(chats);
  }

  markMessagesAsRead(senderId: string, receiverId: string) {
    const messages = this.getMessages();
    const updatedMessages = messages.map(msg => 
      msg.senderId === senderId && msg.receiverId === receiverId && !msg.isRead
        ? { ...msg, isRead: true }
        : msg
    );
    this.setMessages(updatedMessages);
  }

  getUnreadMessageCount(userId: string): number {
    const messages = this.getMessages();
    return messages.filter(msg => msg.receiverId === userId && !msg.isRead).length;
  }

  close() {
    // No-op for browser storage
  }

  // Blocked users methods
  private getBlockedUsers() {
    const data = localStorage.getItem(this.BLOCKED_USERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  private setBlockedUsers(blockedUsers: any[]): void {
    localStorage.setItem(this.BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }

  blockUser(blockerId: string, blockedId: string, reason?: string): boolean {
    try {
      const blockedUsers = this.getBlockedUsers();
      const existingBlock = blockedUsers.find(
        (bu: any) => bu.blockerId === blockerId && bu.blockedId === blockedId
      );
      
      if (existingBlock) return false; // Already blocked
      
      const newBlock = {
        id: uuidv4(),
        blockerId,
        blockedId,
        blockedAt: new Date(),
        reason: reason || null
      };
      
      blockedUsers.push(newBlock);
      this.setBlockedUsers(blockedUsers);
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  unblockUser(blockerId: string, blockedId: string): boolean {
    try {
      const blockedUsers = this.getBlockedUsers();
      const filteredUsers = blockedUsers.filter(
        (bu: any) => !(bu.blockerId === blockerId && bu.blockedId === blockedId)
      );
      
      if (filteredUsers.length === blockedUsers.length) return false; // No block found
      
      this.setBlockedUsers(filteredUsers);
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  isUserBlocked(blockerId: string, blockedId: string): boolean {
    const blockedUsers = this.getBlockedUsers();
    return blockedUsers.some(
      (bu: any) => bu.blockerId === blockerId && bu.blockedId === blockedId
    );
  }

  // Shared files methods
  private getSharedFiles() {
    const data = localStorage.getItem(this.SHARED_FILES_KEY);
    if (!data) return [];
    return JSON.parse(data).map((file: any) => ({
      ...file,
      uploadedAt: new Date(file.uploadedAt)
    }));
  }

  private setSharedFiles(sharedFiles: any[]): void {
    localStorage.setItem(this.SHARED_FILES_KEY, JSON.stringify(sharedFiles));
  }

  private getGroups() {
    const data = localStorage.getItem(this.GROUPS_KEY);
    if (!data) return [];
    const groups = JSON.parse(data);
    return groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt)
    }));
  }

  private setGroups(groups: any[]): void {
    localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
  }

  private getGroupMembersAll() {
    const data = localStorage.getItem(this.GROUP_MEMBERS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((member: any) => ({
      ...member,
      joinedAt: new Date(member.joinedAt)
    }));
  }

  private setGroupMembers(members: any[]): void {
    localStorage.setItem(this.GROUP_MEMBERS_KEY, JSON.stringify(members));
  }

  saveSharedFile(messageId: string, fileName: string, fileSize: number, fileType: string, filePath: string) {
    const sharedFiles = this.getSharedFiles();
    const newFile = {
      id: uuidv4(),
      messageId,
      fileName,
      fileSize,
      fileType,
      filePath,
      uploadedAt: new Date()
    };
    
    sharedFiles.push(newFile);
    this.setSharedFiles(sharedFiles);
    return newFile;
  }

  getSharedFilesForUsers(userId1: string, userId2: string) {
    const messages = this.getMessages();
    const sharedFiles = this.getSharedFiles();
    
    const userMessageIds = messages
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .map(msg => msg.id);
    
    return sharedFiles.filter((file: any) => userMessageIds.includes(file.messageId));
  }

  deleteSharedFile(fileId: string): boolean {
    try {
      const sharedFiles = this.getSharedFiles();
      const filteredFiles = sharedFiles.filter((file: any) => file.id !== fileId);
      
      if (filteredFiles.length === sharedFiles.length) return false; // File not found
      
      this.setSharedFiles(filteredFiles);
      return true;
    } catch (error) {
      console.error('Error deleting shared file:', error);
      return false;
    }
  }

  // Additional missing methods
  deleteMessage(messageId: string): boolean {
    try {
      const messages = this.getMessages();
      const filteredMessages = messages.filter(msg => msg.id !== messageId);
      
      if (filteredMessages.length === messages.length) return false; // Message not found
      
      this.setMessages(filteredMessages);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  clearChatHistory(userId1: string, userId2: string): boolean {
    try {
      const messages = this.getMessages();
      const filteredMessages = messages.filter(msg => 
        !((msg.senderId === userId1 && msg.receiverId === userId2) ||
          (msg.senderId === userId2 && msg.receiverId === userId1))
      );
      
      this.setMessages(filteredMessages);
      
      // Remove chat entry
      const chats = this.getChats();
      const filteredChats = chats.filter(chat => 
        !((chat.userId1 === userId1 && chat.userId2 === userId2) ||
          (chat.userId1 === userId2 && chat.userId2 === userId1))
      );
      
      this.setChats(filteredChats);
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  exportChatHistory(userId1: string, userId2: string): any[] {
    const messages = this.getMessages();
    const users = this.getUsers();
    
    return messages
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .map(msg => {
        const sender = users.find(u => u.id === msg.senderId);
        const receiver = users.find(u => u.id === msg.receiverId);
        return {
          ...msg,
          senderName: sender?.displayName,
          receiverName: receiver?.displayName
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Group-related methods (proper implementation)
  createGroup(name: string, description: string, createdBy: string) {
    const groups = this.getGroups();
    const newGroup = {
      id: uuidv4(),
      name,
      description,
      createdBy,
      createdAt: new Date(),
      members: [],
      settings: {
        isPublic: false,
        allowInvites: true,
        messageRetention: 0,
        allowFileSharing: true,
        requireApproval: false
      }
    };
    
    groups.push(newGroup);
    this.setGroups(groups);
    
    // Add creator as admin
    this.addGroupMember(newGroup.id, createdBy, createdBy, 'admin');
    
    return newGroup;
  }

  getGroupsForUser(userId: string) {
    const groups = this.getGroups();
    const groupMembers = this.getGroupMembersAll();
    
    return groups.filter((group: any) => 
      groupMembers.some((member: any) => member.groupId === group.id && member.userId === userId)
    ).map((group: any) => {
      const groupMembersList = groupMembers.filter((member: any) => member.groupId === group.id);
      return {
        ...group,
        memberCount: groupMembersList.length,
        members: groupMembersList,
        role: groupMembersList.find((m: any) => m.userId === userId)?.role || 'member',
        isMember: true
      };
    });
  }

  addGroupMember(groupId: string, userId: string, addedBy: string, role: 'admin' | 'member' = 'member'): boolean {
    try {
      const groupMembers = this.getGroupMembersAll();
      
      // Check if user is already a member
      if (groupMembers.some((member: any) => member.groupId === groupId && member.userId === userId)) {
        return false;
      }
      
      const newMember = {
        id: uuidv4(),
        groupId,
        userId,
        role,
        addedBy,
        joinedAt: new Date()
      };
      
      groupMembers.push(newMember);
      this.setGroupMembers(groupMembers);
      
      console.log(`Adding user ${userId} to group ${groupId} with role ${role} by ${addedBy}`);
      return true;
    } catch (error) {
      console.error('Error adding group member:', error);
      return false;
    }
  }

  removeGroupMember(groupId: string, userId: string): boolean {
    try {
      const groupMembers = this.getGroupMembersAll();
      const filteredMembers = groupMembers.filter(
        (member: any) => !(member.groupId === groupId && member.userId === userId)
      );
      
      if (filteredMembers.length === groupMembers.length) return false; // Member not found
      
      this.setGroupMembers(filteredMembers);
      return true;
    } catch (error) {
      console.error('Error removing group member:', error);
      return false;
    }
  }

  // Message expiration cleanup
  cleanupExpiredMessages(): number {
    try {
      const messages = this.getMessages();
      const now = new Date();
      const filteredMessages = messages.filter(msg => 
        !msg.expiresAt || new Date(msg.expiresAt) > now
      );
      
      const deletedCount = messages.length - filteredMessages.length;
      if (deletedCount > 0) {
        this.setMessages(filteredMessages);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired messages:', error);
      return 0;
    }
  }

  // Message reporting (minimal implementation)
  reportMessage(messageId: string, reportedBy: string, reason: string) {
    // Return a mock report object for compatibility
    return {
      id: uuidv4(),
      messageId,
      reportedBy,
      reason,
      timestamp: new Date(),
      status: 'pending' as const
    };
  }

  getMessagesForGroup(groupId: string) {
    const messages = this.getMessages();
    return messages
      .filter(msg => msg.groupId === groupId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // SQLite-like prepare method for compatibility (mock implementation)
  prepare(query: string) {
    return {
      run: (...params: any[]) => {
        console.log('Mock prepare.run called with query:', query, 'params:', params);
        // For UPDATE groups query
        if (query.includes('UPDATE groups') && query.includes('SET name')) {
          const groups = this.getGroups();
          const [name, description, groupId] = params;
          const updatedGroups = groups.map((group: any) => 
            group.id === groupId 
              ? { ...group, name: name || group.name, description: description || group.description }
              : group
          );
          this.setGroups(updatedGroups);
          return { changes: 1 };
        }
        return { changes: 0 };
      },
      get: (...params: any[]) => {
        console.log('Mock prepare.get called with query:', query, 'params:', params);
        return undefined;
      },
      all: (...params: any[]) => {
        console.log('Mock prepare.all called with query:', query, 'params:', params);
        return [];
      }
    };
  }

  // Additional group methods for compatibility
  getGroupById(id: string) {
    const groups = this.getGroups();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return undefined;
    
    const groupMembers = this.getGroupMembersAll().filter((m: any) => m.groupId === id);
    return {
      ...group,
      memberCount: groupMembers.length,
      members: groupMembers
    };
  }

  getGroupMembers(groupId: string): any[] {
    return this.getGroupMembersAll().filter((member: any) => member.groupId === groupId);
  }

  createGroupSettings(_groupId: string) {
    // Mock implementation - settings are already created in createGroup
    return {
      isPublic: false,
      allowInvites: true,
      messageRetention: 0,
      allowFileSharing: true,
      requireApproval: false
    };
  }

  getGroupSettings(groupId: string) {
    const groups = this.getGroups();
    const group = groups.find((g: any) => g.id === groupId);
    return group?.settings || {
      isPublic: false,
      allowInvites: true,
      messageRetention: 0,
      allowFileSharing: true,
      requireApproval: false
    };
  }

  updateGroupSettings(groupId: string, settings: any): boolean {
    try {
      const groups = this.getGroups();
      const updatedGroups = groups.map((group: any) => 
        group.id === groupId 
          ? { ...group, settings: { ...group.settings, ...settings } }
          : group
      );
      this.setGroups(updatedGroups);
      return true;
    } catch (error) {
      console.error('Error updating group settings:', error);
      return false;
    }
  }

  updateGroupChatLastMessage(groupId: string, lastMessage: string) {
    // Mock implementation for browser
    console.log(`Updating group ${groupId} last message to: ${lastMessage}`);
  }

  getGroupChat(_groupId: string) {
    // Mock implementation for browser
    return undefined;
  }

  getMessageReportById(_id: string) {
    // Mock implementation for browser
    return undefined;
  }

  // Encryption utilities (same as in database.ts)
  encryptMessage(text: string): string {
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
}

export const browserDb = new BrowserDatabaseService();
