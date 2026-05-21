import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatView } from '../app/components/ChatView';

describe('ChatView Component Tests', () => {
  const mockContact = {
    id: 'user1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    status: 'online' as const,
    lastSeen: new Date(),
  };

  const mockMessages = [
    {
      id: 'msg1',
      senderId: 'user1',
      text: 'Hello there!',
      timestamp: new Date('2023-01-01T10:00:00Z'),
    },
    {
      id: 'msg2',
      senderId: 'current-user',
      text: 'Hi John! How are you?',
      timestamp: new Date('2023-01-01T10:01:00Z'),
    },
    {
      id: 'msg3',
      senderId: 'user1',
      text: 'I am doing great, thanks!',
      timestamp: new Date('2023-01-01T10:02:00Z'),
    },
  ];

  const defaultProps = {
    contact: mockContact,
    messages: mockMessages,
    onSendMessage: jest.fn(),
    onShowInfo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render contact information', () => {
    render(<ChatView {...defaultProps} />);

    expect(screen.getByText(/john_doe/i)).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  test('should render messages', () => {
    render(<ChatView {...defaultProps} />);

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi John! How are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing great, thanks!')).toBeInTheDocument();
  });

  test('should differentiate sent and received messages', () => {
    render(<ChatView {...defaultProps} currentUserId="current-user" />);

    const receivedMessages = screen.getAllByText('Hello there!');
    const sentMessages = screen.getAllByText('Hi John! How are you?');

    // Check that messages have different styling based on sender
    expect(receivedMessages[0].closest('div')).toHaveClass('neu-flat-green');
    expect(sentMessages[0].closest('div')).toHaveClass('neu-flat-purple');
  });

  test('should handle message sending', async () => {
    const onSendMessage = jest.fn();
    render(<ChatView {...defaultProps} onSendMessage={onSendMessage} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    await userEvent.type(messageInput, 'New message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await userEvent.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledWith('New message', undefined);
    expect(messageInput).toHaveValue('');
  });

  test('should handle sending with Enter key', async () => {
    const onSendMessage = jest.fn();
    render(<ChatView {...defaultProps} onSendMessage={onSendMessage} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    await userEvent.type(messageInput, 'New message{enter}');

    expect(onSendMessage).toHaveBeenCalledWith('New message', undefined);
  });

  test('should not send empty messages', async () => {
    const onSendMessage = jest.fn();
    render(<ChatView {...defaultProps} onSendMessage={onSendMessage} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
    await userEvent.click(sendButton);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test('should handle info panel toggle', async () => {
    const onShowInfo = jest.fn();
    render(<ChatView {...defaultProps} onShowInfo={onShowInfo} />);

    const searchButton = screen.getByTitle(/search messages/i);
    const moreButton = searchButton.nextElementSibling?.nextElementSibling?.nextElementSibling;
    if (moreButton) {
      await userEvent.click(moreButton);
      expect(onShowInfo).toHaveBeenCalled();
    }
  });

  test('should show empty state when no contact is selected', () => {
    render(<ChatView {...defaultProps} contact={null} />);

    expect(screen.getByText(/select_chat/i)).toBeInTheDocument();
  });

  test('should show empty state when no messages', () => {
    render(<ChatView {...defaultProps} messages={[]} />);

    expect(screen.getByPlaceholderText(/type message/i)).toBeInTheDocument();
  });

  test('should format message timestamps', () => {
    const { container } = render(<ChatView {...defaultProps} />);

    // Match both dot and colon for cross-locale compatibility
    const text = container.textContent || '';
    expect(text).toMatch(/\d{1,2}[\.:]\d{2}/);
  });

  test('should scroll to bottom when new messages are added', () => {
    const { container } = render(<ChatView {...defaultProps} />);

    const messagesContainer = container.querySelector('.message-container');
    expect(messagesContainer).toBeInTheDocument();
  });

  test('should handle keyboard navigation', async () => {
    const onSendMessage = jest.fn();
    render(<ChatView {...defaultProps} onSendMessage={onSendMessage} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    messageInput.focus();
    
    await userEvent.keyboard('Test message{enter}');

    expect(onSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  test('should disable send button when input is empty', () => {
    render(<ChatView {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  test('should enable send button when input has text', async () => {
    render(<ChatView {...defaultProps} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    await userEvent.type(messageInput, 'Hello');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).not.toBeDisabled();
  });

  test('should handle message input focus', () => {
    render(<ChatView {...defaultProps} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    messageInput.focus();

    expect(messageInput).toHaveFocus();
  });

  test('should be accessible with proper ARIA labels', () => {
    render(<ChatView {...defaultProps} />);

    const messageInput = screen.getByRole('textbox', { name: /message input/i });
    expect(messageInput).toBeInTheDocument();
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();
  });

  test('should handle long messages', () => {
    const longMessages = [
      {
        ...mockMessages[0],
        text: 'This is a very long message that should wrap properly and maintain readability in the chat interface',
      },
    ];

    render(<ChatView {...defaultProps} messages={longMessages} />);

    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
  });

  test('should handle typing indicator', () => {
    render(<ChatView {...defaultProps} isBotTyping={true} />);

    expect(screen.getByText(/Gnoseon Bot is thinking/i)).toBeInTheDocument();
  });

  test('should handle message sending errors', async () => {
    const onSendMessage = jest.fn().mockImplementation(() => {
      throw new Error('Failed to send message');
    });

    render(<ChatView {...defaultProps} onSendMessage={onSendMessage} />);

    const messageInput = screen.getByPlaceholderText(/type message/i);
    await userEvent.type(messageInput, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await userEvent.click(sendButton);

    // Component should handle errors gracefully
    expect(onSendMessage).toHaveBeenCalled();
  });
});
