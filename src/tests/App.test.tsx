import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../app/App';

// Mock the database
const mockDb = {
  getAllUsers: jest.fn(),
  getChatsForUser: jest.fn(),
  getUserById: jest.fn(),
  createMessage: jest.fn(),
  markMessagesAsRead: jest.fn(),
  getMessagesBetweenUsers: jest.fn(),
  getUnreadMessageCount: jest.fn(),
};

// Mock the getDatabase function
jest.mock('../database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
  User: {},
  Message: {},
  Chat: {},
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

describe('App Component Tests', () => {
  const mockOtherUser = {
    id: 'user2',
    username: 'otheruser',
    displayName: 'Other User',
    password: 'hashedpassword2',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock database responses
    mockDb.getAllUsers.mockReturnValue([mockOtherUser]);
    mockDb.getChatsForUser.mockReturnValue([]);
    mockDb.getUserById.mockReturnValue(mockOtherUser);
    mockDb.createMessage.mockReturnValue({
      id: 'msg1',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Test message',
      timestamp: new Date(),
      isRead: false,
    });
    mockDb.getMessagesBetweenUsers.mockReturnValue([]);
    mockDb.getUnreadMessageCount.mockReturnValue(0);
  });

  test('should show login form when user is not authenticated', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  test('should show main app when user is authenticated', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('should display contacts from database', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });

    expect(mockDb.getAllUsers).toHaveBeenCalled();
    expect(mockDb.getChatsForUser).toHaveBeenCalledWith('user1');
  });

  test('should switch between tabs', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Click on contacts tab
    const contactsTab = screen.getByText('Contacts');
    await userEvent.click(contactsTab);

    expect(screen.getByText('Contacts')).toBeInTheDocument();

    // Click on settings tab
    const settingsTab = screen.getByText('Settings');
    await userEvent.click(settingsTab);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('should handle message sending', async () => {
    // Mock a chat
    const mockChat = {
      id: 'chat1',
      userId1: 'user1',
      userId2: 'user2',
      lastMessage: 'Hello',
      lastMessageTime: new Date(),
      createdAt: new Date(),
    };

    mockDb.getChatsForUser.mockReturnValue([mockChat]);
    mockDb.getMessagesBetweenUsers.mockReturnValue([
      {
        id: 'msg1',
        senderId: 'user2',
        receiverId: 'user1',
        text: 'Hello',
        timestamp: new Date(),
        isRead: false,
      }
    ]);

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Click on the chat to open it
    const chatElement = screen.getByText('Other User');
    await userEvent.click(chatElement);

    // Type a message
    const messageInput = screen.getByPlaceholderText('Type a message...');
    await userEvent.type(messageInput, 'Hello back!');

    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    expect(mockDb.createMessage).toHaveBeenCalledWith('user1', 'user2', 'Hello back!');
  });

  test('should handle chat selection', async () => {
    const mockChat = {
      id: 'chat1',
      userId1: 'user1',
      userId2: 'user2',
      lastMessage: 'Hello',
      lastMessageTime: new Date(),
      createdAt: new Date(),
    };

    mockDb.getChatsForUser.mockReturnValue([mockChat]);
    mockDb.getMessagesBetweenUsers.mockReturnValue([]);

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Click on the chat
    const chatElement = screen.getByText('Other User');
    await userEvent.click(chatElement);

    // Should mark messages as read
    expect(mockDb.markMessagesAsRead).toHaveBeenCalledWith('user2', 'user1');
  });

  test('should handle starting new chat from contacts', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Go to contacts tab
    const contactsTab = screen.getByText('Contacts');
    await userEvent.click(contactsTab);

    // Click on start chat button
    const startChatButton = screen.getByText('Start Chat');
    await userEvent.click(startChatButton);

    // Should switch back to home tab and select the chat
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('should handle search functionality', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await userEvent.type(searchInput, 'Other');

    // Should filter the contacts/chats
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  test('should handle mobile sidebar toggle', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Open a chat to hide sidebar
    const chatElement = screen.getByText('Other User');
    await userEvent.click(chatElement);

    // Should show menu button on mobile
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();

    // Click menu button to show sidebar
    await userEvent.click(menuButton);

    // Sidebar should be visible again
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  test('should handle info panel toggle', async () => {
    const mockChat = {
      id: 'chat1',
      userId1: 'user1',
      userId2: 'user2',
      lastMessage: 'Hello',
      lastMessageTime: new Date(),
      createdAt: new Date(),
    };

    mockDb.getChatsForUser.mockReturnValue([mockChat]);
    mockDb.getMessagesBetweenUsers.mockReturnValue([]);

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Open a chat
    const chatElement = screen.getByText('Other User');
    await userEvent.click(chatElement);

    // Click info button to show info panel
    const infoButton = screen.getByRole('button', { name: /info/i });
    await userEvent.click(infoButton);

    // Should show contact info
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  test('should handle database initialization error', async () => {
    // Mock getDatabase to throw an error
    const { getDatabase } = require('../database/index');
    getDatabase.mockRejectedValue(new Error('Database connection failed'));

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    // Should still render the app without crashing
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('should handle logout', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'user1',
      username: 'testuser'
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    // Should show login form
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('gnoseon_user');
  });
});
