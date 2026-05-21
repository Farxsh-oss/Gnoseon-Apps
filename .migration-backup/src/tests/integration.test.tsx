import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../app/App';

// Mock the database with realistic behavior
const mockUsers = [
  {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
  },
  {
    id: 'user2',
    username: 'otheruser',
    displayName: 'Other User',
    password: 'hashedpassword2',
    createdAt: new Date(),
  },
];

const mockMessages = [
  {
    id: 'msg1',
    senderId: 'user2',
    receiverId: 'user1',
    text: 'Hello from other user!',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    isRead: false,
  },
];

const mockChats = [
  {
    id: 'chat1',
    userId1: 'user1',
    userId2: 'user2',
    lastMessage: 'Hello from other user!',
    lastMessageTime: new Date('2023-01-01T10:00:00Z'),
    createdAt: new Date('2023-01-01T09:00:00Z'),
  },
];

const mockDb = {
  getAllUsers: jest.fn(),
  getChatsForUser: jest.fn(),
  getUserById: jest.fn(),
  createMessage: jest.fn(),
  markMessagesAsRead: jest.fn(),
  getMessagesBetweenUsers: jest.fn(),
  getUnreadMessageCount: jest.fn(),
  validateUser: jest.fn(),
  createUser: jest.fn(),
  close: jest.fn(),
};

// Mock the database module
jest.mock('../database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
  User: {},
  Message: {},
  Chat: {},
}));

// Mock the browser database as well
jest.mock('../database/browser-database', () => ({
  browserDb: mockDb,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Setup default mock responses
    mockDb.getAllUsers.mockReturnValue(mockUsers.slice(1)); // Exclude current user
    mockDb.getChatsForUser.mockReturnValue(mockChats);
    mockDb.getUserById.mockReturnValue(mockUsers[1]);
    mockDb.createMessage.mockReturnValue({
      id: 'msg2',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Reply message',
      timestamp: new Date(),
      isRead: false,
    });
    mockDb.getMessagesBetweenUsers.mockReturnValue(mockMessages);
    mockDb.getUnreadMessageCount.mockReturnValue(1);
    mockDb.validateUser.mockResolvedValue(mockUsers[0]);
  });

  describe('Complete User Flow', () => {
    test('should handle complete login to chat flow', async () => {
      render(<App />);

      // Should show login form initially
      expect(screen.getByText('Login')).toBeInTheDocument();

      // Fill in login form
      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);

      // Should show main app after login
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Should load contacts and chats
      expect(mockDb.getAllUsers).toHaveBeenCalled();
      expect(mockDb.getChatsForUser).toHaveBeenCalledWith('user1');

      // Should show existing chats
      expect(screen.getByText('Other User')).toBeInTheDocument();
      expect(screen.getByText('Hello from other user!')).toBeInTheDocument();
    });

    test('should handle complete messaging flow', async () => {
      // Start with logged in user
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Click on existing chat
      const chatElement = screen.getByText('Other User');
      await userEvent.click(chatElement);

      // Should mark messages as read
      expect(mockDb.markMessagesAsRead).toHaveBeenCalledWith('user2', 'user1');

      // Should load chat messages
      expect(mockDb.getMessagesBetweenUsers).toHaveBeenCalledWith('user1', 'user2');

      // Type and send a message
      const messageInput = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(messageInput, 'Hello back!');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      // Should create message
      expect(mockDb.createMessage).toHaveBeenCalledWith('user1', 'user2', 'Hello back!');

      // Should update chat list
      expect(mockDb.getChatsForUser).toHaveBeenCalledTimes(2); // Once on load, once after message
    });

    test('should handle starting new chat from contacts', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      // Mock no existing chats
      mockDb.getChatsForUser.mockReturnValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Go to contacts tab
      const contactsTab = screen.getByText('Contacts');
      await userEvent.click(contactsTab);

      // Should show all users
      expect(screen.getByText('Other User')).toBeInTheDocument();

      // Start new chat
      const startChatButton = screen.getByText('Start Chat');
      await userEvent.click(startChatButton);

      // Should switch back to home tab
      expect(screen.getByText('Home')).toBeInTheDocument();

      // Should create new chat
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });
  });

  describe('Data Synchronization', () => {
    test('should sync data when user logs in', async () => {
      render(<App />);

      // Login
      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Should sync all necessary data
      expect(mockDb.getAllUsers).toHaveBeenCalled();
      expect(mockDb.getChatsForUser).toHaveBeenCalledWith('user1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gnoseon_user',
        JSON.stringify({ id: 'user1', username: 'testuser' })
      );
    });

    test('should handle real-time message updates', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Open chat
      const chatElement = screen.getByText('Other User');
      await userEvent.click(chatElement);

      // Send message
      const messageInput = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(messageInput, 'New message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      // Should update UI with new message
      await waitFor(() => {
        expect(mockDb.createMessage).toHaveBeenCalledWith('user1', 'user2', 'New message');
      });

      // Should refresh chat data
      expect(mockDb.getChatsForUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      const { getDatabase } = require('../database/index');
      getDatabase.mockRejectedValue(new Error('Database connection failed'));

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      // Should still render app without crashing
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Should not load data
      expect(mockDb.getAllUsers).not.toHaveBeenCalled();
    });

    test('should handle message sending failures', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      mockDb.createMessage.mockImplementation(() => {
        throw new Error('Failed to send message');
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Try to send message
      const chatElement = screen.getByText('Other User');
      await userEvent.click(chatElement);

      const messageInput = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      // Should handle error without crashing
      expect(mockDb.createMessage).toHaveBeenCalled();
    });

    test('should handle user authentication failures', async () => {
      mockDb.validateUser.mockResolvedValue(null);

      render(<App />);

      // Try to login with invalid credentials
      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(loginButton);

      // Should remain on login screen
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      // Should not save user data
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    test('should not make unnecessary database calls', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Should only call database once on initial load
      expect(mockDb.getAllUsers).toHaveBeenCalledTimes(1);
      expect(mockDb.getChatsForUser).toHaveBeenCalledTimes(1);

      // Switch tabs - should not call database again
      const contactsTab = screen.getByText('Contacts');
      await userEvent.click(contactsTab);

      expect(mockDb.getAllUsers).toHaveBeenCalledTimes(1);
      expect(mockDb.getChatsForUser).toHaveBeenCalledTimes(1);
    });

    test('should handle large chat lists efficiently', async () => {
      // Mock many chats
      const manyChats = Array.from({ length: 100 }, (_, i) => ({
        id: `chat${i}`,
        userId1: 'user1',
        userId2: `user${i + 2}`,
        lastMessage: `Message ${i}`,
        lastMessageTime: new Date(),
        createdAt: new Date(),
      }));

      mockDb.getChatsForUser.mockReturnValue(manyChats);

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Should render all chats
      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByText('Message 99')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Tab through interface
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();

      // Should focus on interactive elements
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });

    test('should have proper ARIA labels', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        id: 'user1',
        username: 'testuser'
      }));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Check for proper ARIA labels
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toHaveAttribute('aria-label');
    });
  });
});
