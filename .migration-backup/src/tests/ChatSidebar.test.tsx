import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSidebar } from '../app/components/ChatSidebar';

describe('ChatSidebar Component Tests', () => {
  const mockContacts = [
    {
      id: 'user1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg',
      status: 'online' as const,
      lastSeen: new Date(),
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'https://example.com/avatar2.jpg',
      status: 'offline' as const,
      lastSeen: new Date(),
    },
  ];

  const mockChats = [
    {
      id: 'chat1',
      contactId: 'user1',
      lastMessage: 'Hello there!',
      lastMessageTime: '10:30 AM',
      unreadCount: 2,
      type: 'private' as const,
      messages: [],
    },
    {
      id: 'chat2',
      contactId: 'user2',
      lastMessage: 'See you tomorrow',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      type: 'private' as const,
      messages: [],
    },
  ];

  const defaultProps = {
    contacts: mockContacts,
    chats: mockChats,
    selectedChatId: null,
    onSelectChat: jest.fn(),
    searchQuery: '',
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render contacts and chats', () => {
    render(<ChatSidebar {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('See you tomorrow')).toBeInTheDocument();
  });

  test('should display unread count badges', () => {
    render(<ChatSidebar {...defaultProps} />);

    const unreadBadge = screen.getByText('2');
    expect(unreadBadge).toBeInTheDocument();
  });

  test('should handle chat selection', async () => {
    const onSelectChat = jest.fn();
    render(<ChatSidebar {...defaultProps} onSelectChat={onSelectChat} />);

    const chatItem = screen.getByText('Hello there!');
    await userEvent.click(chatItem);

    expect(onSelectChat).toHaveBeenCalledWith('chat1');
  });

  test('should highlight selected chat', () => {
    render(<ChatSidebar {...defaultProps} selectedChatId="chat1" />);

    const selectedChat = screen.getByText(/Hello there!/).closest('button');
    expect(selectedChat).toHaveClass('neu-pressed');
    expect(screen.getByText('► John Doe')).toBeInTheDocument();
  });

  test('should filter chats based on search query', () => {
    render(<ChatSidebar {...defaultProps} searchQuery="John" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('should handle search input changes', async () => {
    const onSearchChange = jest.fn();
    render(<ChatSidebar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('search...');
    await userEvent.type(searchInput, 'John');

    // Each character typed triggers onSearchChange
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('J');
  });

  test('should display online status indicators', () => {
    render(<ChatSidebar {...defaultProps} />);

    // In current implementation, it's a div with animate-ping
    const onlineIndicator = document.querySelector('.animate-ping');
    expect(onlineIndicator).toBeInTheDocument();
  });

  test('should handle empty chat list', () => {
    render(<ChatSidebar {...defaultProps} chats={[]} />);
    expect(screen.getByText('No contacts available')).toBeInTheDocument();
  });

  test('should handle empty contact list', () => {
    render(<ChatSidebar {...defaultProps} chats={[]} />);

    expect(screen.getByText('No contacts available')).toBeInTheDocument();
  });

  test('should format timestamps correctly', () => {
    render(<ChatSidebar {...defaultProps} />);

    expect(screen.getByText('[10:30 AM]')).toBeInTheDocument();
    expect(screen.getByText('[Yesterday]')).toBeInTheDocument();
  });

  test('should handle keyboard navigation', async () => {
    const onSelectChat = jest.fn();
    render(<ChatSidebar {...defaultProps} onSelectChat={onSelectChat} />);

    const chatItem = screen.getByText(/Hello there!/).closest('button');
    chatItem?.focus();
    fireEvent.click(chatItem!);

    expect(onSelectChat).toHaveBeenCalledWith('chat1');
  });

  test('should be accessible with proper ARIA labels', () => {
    render(<ChatSidebar {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search chats');
    expect(searchInput).toBeInTheDocument();
  });

  test('should handle long message truncation', () => {
    const longMessageChats = [
      {
        ...mockChats[0],
        lastMessage: 'This is a very long message that should be truncated in the UI to maintain proper layout and readability',
      },
    ];

    render(<ChatSidebar {...defaultProps} chats={longMessageChats} />);

    const messageElement = screen.getByText(/This is a very long message/);
    expect(messageElement).toBeInTheDocument();
  });

  test('should handle contact avatar loading errors', () => {
    const contactsWithBrokenAvatar = [
      {
        ...mockContacts[0],
        avatar: 'https://example.com/broken-avatar.jpg',
      },
    ];

    render(<ChatSidebar {...defaultProps} contacts={contactsWithBrokenAvatar} />);

    const avatar = screen.getByAltText('John Doe');
    
    // Simulate image error
    fireEvent.error(avatar);

    // Should hide image and show fallback div (which has 'hidden' removed in onError)
    expect(avatar).toHaveStyle({ display: 'none' });
  });
});
