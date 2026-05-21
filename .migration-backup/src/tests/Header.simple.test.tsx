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

    const contactsTab = screen.getByText('[C]ontacts');
    expect(contactsTab.closest('button')).toHaveClass('neu-pressed');
  });

  test('should handle tab changes', async () => {
    const onTabChange = jest.fn();
    render(<Header {...defaultProps} onTabChange={onTabChange} />);

    const contactsTab = screen.getByText('[C]ontacts');
    await userEvent.click(contactsTab);

    expect(onTabChange).toHaveBeenCalledWith('contacts');
  });

  test('should handle logout', async () => {
    const onLogout = jest.fn();
    render(<Header {...defaultProps} onLogout={onLogout} />);

    const logoutButton = screen.getByTitle('Logout');
    await userEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalled();
  });

  test('should not show logout button when onLogout is not provided', () => {
    const propsWithoutLogout = { ...defaultProps, onLogout: undefined };
    render(<Header {...propsWithoutLogout} />);

    expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
  });

  test('should render navigation tabs', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('[H]ome')).toBeInTheDocument();
    expect(screen.getByText('[C]ontacts')).toBeInTheDocument();
    expect(screen.getByText('[S]ettings')).toBeInTheDocument();
  });

  test('should handle keyboard navigation', async () => {
    const onTabChange = jest.fn();
    render(<Header {...defaultProps} onTabChange={onTabChange} />);

    const contactsTab = screen.getByText('[C]ontacts').closest('button');
    if (!contactsTab) throw new Error('Button not found');
    
    contactsTab.focus();
    
    // Ensure the element is focused
    expect(contactsTab).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');

    expect(onTabChange).toHaveBeenCalledWith('contacts');
  });

  test('should apply correct styles for inactive tabs', () => {
    render(<Header {...defaultProps} activeTab="home" />);

    const contactsTab = screen.getByText('[C]ontacts');
    const settingsTab = screen.getByText('[S]ettings');

    expect(contactsTab.closest('button')).toHaveClass('neu-raised');
    expect(settingsTab.closest('button')).toHaveClass('neu-raised');
  });

  test('should render status icons', () => {
    render(<Header {...defaultProps} />);

    // Check for status icons (they should be present but not visible on small screens)
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
  });

  test('should render logo', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getAllByText('Gnoseon')).toHaveLength(2);
  });

  test('should render marquee text', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getAllByText('selamat datang')).toHaveLength(2);
    expect(screen.getAllByText('user')).toHaveLength(2);
    expect(screen.getAllByText('Gnoseon')).toHaveLength(2);
  });
});
