import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../app/components/Header';

describe('Header Component Tests', () => {
  const mockUser = {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
  };

  const defaultProps = {
    activeTab: 'home' as const,
    onTabChange: jest.fn(),
    user: mockUser,
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render user information', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('should display active tab correctly', () => {
    render(<Header {...defaultProps} activeTab="contacts" />);

    const contactsTab = screen.getByText(/\[C\]ontacts/i).closest('button');
    expect(contactsTab).toHaveClass('neu-pressed');
    expect(contactsTab).toHaveClass('text-green-600');
  });

  test('should handle tab changes', async () => {
    const onTabChange = jest.fn();
    render(<Header {...defaultProps} onTabChange={onTabChange} />);

    const contactsTab = screen.getByText(/\[C\]ontacts/i).closest('button');
    await userEvent.click(contactsTab!);

    expect(onTabChange).toHaveBeenCalledWith('contacts');
  });

  test('should handle logout', async () => {
    const onLogout = jest.fn();
    render(<Header {...defaultProps} onLogout={onLogout} />);

    const logoutButton = screen.getByTitle('Logout');
    await userEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalled();
  });

  test('should handle keyboard navigation', async () => {
    const onTabChange = jest.fn();
    render(<Header {...defaultProps} onTabChange={onTabChange} />);

    const contactsTab = screen.getByText(/\[C\]ontacts/i).closest('button');
    contactsTab?.focus();
    await userEvent.keyboard('{Enter}');

    expect(onTabChange).toHaveBeenCalledWith('contacts');
  });

  test('should apply correct styles for inactive tabs', () => {
    render(<Header {...defaultProps} activeTab="home" />);

    const contactsTab = screen.getByText(/\[C\]ontacts/i).closest('button');
    const settingsTab = screen.getByText(/\[S\]ettings/i).closest('button');

    expect(contactsTab).toHaveClass('text-gray-600');
    expect(settingsTab).toHaveClass('text-gray-600');
    expect(contactsTab).toHaveClass('neu-raised');
  });
});
