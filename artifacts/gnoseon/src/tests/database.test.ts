import { getDatabase, User } from '../database/index';

describe('DatabaseService API Tests', () => {
  let db: any;

  beforeEach(async () => {
    // Create a new database instance for each test
    db = await getDatabase();
  });

  afterEach(() => {
    // Clean up the database after each test
    if (db && db.close) {
      db.close();
    }
  });

  describe('User Management', () => {
    test('should create a new user', async () => {
      const user = await db.createUser('testuser', 'password123', 'Test User');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.password).not.toBe('password123'); // Should be hashed
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('should not create duplicate users', async () => {
      await db.createUser('testuser', 'password123', 'Test User');
      
      await expect(db.createUser('testuser', 'password456', 'Another User'))
        .rejects.toThrow();
    });

    test('should validate user credentials', async () => {
      const createdUser = await db.createUser('testuser', 'password123', 'Test User');
      const validatedUser = await db.validateUser('testuser', 'password123');
      
      expect(validatedUser).toBeDefined();
      expect(validatedUser!.id).toBe(createdUser.id);
      expect(validatedUser!.username).toBe('testuser');
    });

    test('should reject invalid credentials', async () => {
      await db.createUser('testuser', 'password123', 'Test User');
      
      const invalidUser = await db.validateUser('testuser', 'wrongpassword');
      expect(invalidUser).toBeNull();
      
      const nonExistentUser = await db.validateUser('nonexistent', 'password123');
      expect(nonExistentUser).toBeNull();
    });

    test('should get user by ID', async () => {
      const createdUser = await db.createUser('testuser', 'password123', 'Test User');
      const foundUser = db.getUserById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.username).toBe('testuser');
    });

    test('should get user by username', async () => {
      await db.createUser('testuser', 'password123', 'Test User');
      const foundUser = db.getUserByUsername('testuser');
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe('testuser');
      expect(foundUser!.displayName).toBe('Test User');
    });

    test('should get all users', async () => {
      await db.createUser('user1', 'password1', 'User One');
      await db.createUser('user2', 'password2', 'User Two');
      await db.createUser('user3', 'password3', 'User Three');
      
      const allUsers = db.getAllUsers();
      expect(allUsers).toHaveLength(3);
      expect(allUsers.map((u: User) => u.username)).toContain('user1');
      expect(allUsers.map((u: User) => u.username)).toContain('user2');
      expect(allUsers.map((u: User) => u.username)).toContain('user3');
    });
  });

  describe('Message Management', () => {
    let user1: User;
    let user2: User;

    beforeEach(async () => {
      user1 = await db.createUser('user1', 'password1', 'User One');
      user2 = await db.createUser('user2', 'password2', 'User Two');
    });

    test('should create a message', () => {
      const message = db.createMessage(user1.id, user2.id, 'Hello, User Two!');
      
      expect(message).toBeDefined();
      expect(message.senderId).toBe(user1.id);
      expect(message.receiverId).toBe(user2.id);
      expect(message.text).toBe('Hello, User Two!');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.isRead).toBe(false);
    });

    test('should get message by ID', () => {
      const createdMessage = db.createMessage(user1.id, user2.id, 'Test message');
      const foundMessage = db.getMessageById(createdMessage.id);
      
      expect(foundMessage).toBeDefined();
      expect(foundMessage!.id).toBe(createdMessage.id);
      expect(foundMessage!.text).toBe('Test message');
    });

    test('should get messages between users', () => {
      db.createMessage(user1.id, user2.id, 'Message 1');
      db.createMessage(user2.id, user1.id, 'Reply 1');
      db.createMessage(user1.id, user2.id, 'Message 2');
      
      const messages = db.getMessagesBetweenUsers(user1.id, user2.id);
      expect(messages).toHaveLength(3);
      expect(messages[0].text).toBe('Message 1');
      expect(messages[1].text).toBe('Reply 1');
      expect(messages[2].text).toBe('Message 2');
    });

    test('should mark messages as read', () => {
      const message = db.createMessage(user1.id, user2.id, 'Unread message');
      expect(message.isRead).toBe(false);
      
      db.markMessagesAsRead(user1.id, user2.id);
      
      const updatedMessage = db.getMessageById(message.id);
      expect(updatedMessage!.isRead).toBe(true);
    });

    test('should get unread message count', () => {
      db.createMessage(user1.id, user2.id, 'Unread 1');
      db.createMessage(user1.id, user2.id, 'Unread 2');
      db.createMessage(user2.id, user1.id, 'Reply');
      
      const unreadCount = db.getUnreadMessageCount(user2.id);
      expect(unreadCount).toBe(2);
    });
  });

  describe('Chat Management', () => {
    let user1: User;
    let user2: User;
    let user3: User;

    beforeEach(async () => {
      user1 = await db.createUser('user1', 'password1', 'User One');
      user2 = await db.createUser('user2', 'password2', 'User Two');
      user3 = await db.createUser('user3', 'password3', 'User Three');
    });

    test('should create chat when message is sent', () => {
      db.createMessage(user1.id, user2.id, 'First message');
      
      const chat = db.getChatForUsers(user1.id, user2.id);
      expect(chat).toBeDefined();
      expect(chat!.userId1).toBe(user1.id);
      expect(chat!.userId2).toBe(user2.id);
      expect(chat!.lastMessage).toBe('First message');
    });

    test('should get chats for user', () => {
      db.createMessage(user1.id, user2.id, 'Chat 1');
      db.createMessage(user1.id, user3.id, 'Chat 2');
      db.createMessage(user2.id, user3.id, 'Chat 3');
      
      const user1Chats = db.getChatsForUser(user1.id);
      expect(user1Chats).toHaveLength(2);
      
      const user2Chats = db.getChatsForUser(user2.id);
      expect(user2Chats).toHaveLength(2);
      
      const user3Chats = db.getChatsForUser(user3.id);
      expect(user3Chats).toHaveLength(2);
    });

    test('should update chat last message', () => {
      db.createMessage(user1.id, user2.id, 'First message');
      
      const chat1 = db.getChatForUsers(user1.id, user2.id);
      expect(chat1!.lastMessage).toBe('First message');
      
      db.createMessage(user2.id, user1.id, 'Second message');
      
      const chat2 = db.getChatForUsers(user1.id, user2.id);
      expect(chat2!.lastMessage).toBe('Second message');
    });

    test('should not create duplicate chats', () => {
      db.createMessage(user1.id, user2.id, 'Message 1');
      db.createMessage(user2.id, user1.id, 'Message 2');
      
      const chats1 = db.getChatsForUser(user1.id);
      const chats2 = db.getChatsForUser(user2.id);
      
      expect(chats1).toHaveLength(1);
      expect(chats2).toHaveLength(1);
      
      const chat1 = db.getChatForUsers(user1.id, user2.id);
      const chat2 = db.getChatForUsers(user2.id, user1.id);
      
      expect(chat1!.id).toBe(chat2!.id);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle non-existent user lookup', () => {
      const user = db.getUserById('non-existent-id');
      expect(user).toBeUndefined();
      
      const userByUsername = db.getUserByUsername('non-existent');
      expect(userByUsername).toBeUndefined();
    });

    test('should handle non-existent message lookup', () => {
      const message = db.getMessageById('non-existent-id');
      expect(message).toBeUndefined();
    });

    test('should handle non-existent chat lookup', async () => {
      const user1 = await db.createUser('user1', 'password1', 'User One');
      const user2 = await db.createUser('user2', 'password2', 'User Two');
      
      const chat = db.getChatForUsers(user1.id, user2.id);
      expect(chat).toBeUndefined();
    });

    test('should handle empty message history', async () => {
      const user1 = await db.createUser('user1', 'password1', 'User One');
      const user2 = await db.createUser('user2', 'password2', 'User Two');
      
      const messages = db.getMessagesBetweenUsers(user1.id, user2.id);
      expect(messages).toHaveLength(0);
    });

    test('should handle zero unread messages', async () => {
      const user = await db.createUser('user1', 'password1', 'User One');
      
      const unreadCount = db.getUnreadMessageCount(user.id);
      expect(unreadCount).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    test('should maintain user-message relationships', async () => {
      const user1 = await db.createUser('user1', 'password1', 'User One');
      const user2 = await db.createUser('user2', 'password2', 'User Two');
      
      const message = db.createMessage(user1.id, user2.id, 'Test message');
      const retrievedMessage = db.getMessageById(message.id);
      
      expect(retrievedMessage!.senderId).toBe(user1.id);
      expect(retrievedMessage!.receiverId).toBe(user2.id);
    });

    test('should handle concurrent message creation', async () => {
      const user1 = await db.createUser('user1', 'password1', 'User One');
      const user2 = await db.createUser('user2', 'password2', 'User Two');
      
      const message1 = db.createMessage(user1.id, user2.id, 'Message 1');
      const message2 = db.createMessage(user2.id, user1.id, 'Message 2');
      
      expect(message1.id).not.toBe(message2.id);
      expect(message1.timestamp).toBeInstanceOf(Date);
      expect(message2.timestamp).toBeInstanceOf(Date);
    });

    test('should preserve message order', async () => {
      const user1 = await db.createUser('user1', 'password1', 'User One');
      const user2 = await db.createUser('user2', 'password2', 'User Two');
      
      // Note: In a real scenario, you'd need to mock the timestamp
      // For now, we test that messages are ordered by timestamp
      db.createMessage(user1.id, user2.id, 'First');
      db.createMessage(user2.id, user1.id, 'Second');
      db.createMessage(user1.id, user2.id, 'Third');
      
      const messages = db.getMessagesBetweenUsers(user1.id, user2.id);
      expect(messages).toHaveLength(3);
      expect(messages[0].text).toBe('First');
      expect(messages[1].text).toBe('Second');
      expect(messages[2].text).toBe('Third');
    });
  });
});
