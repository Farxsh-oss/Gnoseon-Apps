import { RegisterLoginTest, BOT_USERS } from './registerLoginTest';
import { apiService } from '../services/apiService';

// Mock the apiService module
jest.mock('../services/apiService', () => ({
  apiService: {
    healthCheck: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('Register-Login Flow Tests for Bot Accounts', () => {
  let testInstance: RegisterLoginTest;

  beforeEach(() => {
    testInstance = new RegisterLoginTest();
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should pass health check successfully', async () => {
      const mockHealthData = { status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' };
      mockedApiService.healthCheck.mockResolvedValue(mockHealthData);

      await testInstance.testHealthCheck();

      expect(mockedApiService.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('should handle health check failure', async () => {
      mockedApiService.healthCheck.mockRejectedValue(new Error('Server down'));

      await testInstance.testHealthCheck();

      expect(mockedApiService.healthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Registration', () => {
    it('should register multiple bot users successfully', async () => {
      for (const bot of BOT_USERS) {
        const mockUser = {
          user: {
            id: `user-${bot.username}`,
            username: bot.username,
            displayName: bot.displayName,
            avatar: null,
            bio: null,
            status: 'offline'
          }
        };
        mockedApiService.register.mockResolvedValue(mockUser);
      }

      await testInstance.testRegisterMultipleUsers();

      expect(mockedApiService.register).toHaveBeenCalledTimes(BOT_USERS.length);
      
      // Verify each bot was registered with correct data
      BOT_USERS.forEach((bot, index) => {
        expect(mockedApiService.register).toHaveBeenNthCalledWith(
          index + 1,
          bot.username,
          bot.password,
          bot.displayName
        );
      });
    });

    it('should handle duplicate registration attempts', async () => {
      const duplicateError = new Error('Username already exists');
      mockedApiService.register.mockRejectedValue(duplicateError);

      await testInstance.testRegisterMultipleUsers();

      expect(mockedApiService.register).toHaveBeenCalled();
    });
  });

  describe('User Login', () => {
    it('should login multiple bot users successfully', async () => {
      for (const bot of BOT_USERS) {
        const mockLoginResponse = {
          user: {
            id: `user-${bot.username}`,
            username: bot.username,
            displayName: bot.displayName,
            avatar: null,
            bio: null,
            status: 'online'
          }
        };
        mockedApiService.login.mockResolvedValue(mockLoginResponse);
      }

      await testInstance.testLoginMultipleUsers();

      expect(mockedApiService.login).toHaveBeenCalledTimes(BOT_USERS.length);
      
      // Verify each bot was logged in with correct credentials
      BOT_USERS.forEach((bot, index) => {
        expect(mockedApiService.login).toHaveBeenNthCalledWith(
          index + 1,
          bot.username,
          bot.password
        );
      });
    });

    it('should handle invalid login attempts', async () => {
      const invalidCredentialsError = new Error('Invalid credentials');
      mockedApiService.login.mockRejectedValue(invalidCredentialsError);

      await testInstance.testInvalidLogin();

      expect(mockedApiService.login).toHaveBeenCalled();
    });
  });

  describe('Validation Tests', () => {
    it('should reject duplicate registrations', async () => {
      const duplicateError = new Error('Username already exists');
      mockedApiService.register.mockRejectedValue(duplicateError);

      await testInstance.testDuplicateRegistration();

      expect(mockedApiService.register).toHaveBeenCalledWith(
        BOT_USERS[0].username,
        'newpass123',
        'New Name'
      );
    });

    it('should validate password requirements', async () => {
      // Test short password (should fail)
      mockedApiService.register.mockRejectedValue(
        new Error('Password must be at least 6 characters')
      );

      await testInstance.testPasswordValidation();

      expect(mockedApiService.register).toHaveBeenCalledWith(
        'shortpassbot',
        '123',
        'Short Pass Bot'
      );
    });

    it('should handle logout functionality', async () => {
      const mockUser = {
        id: 'user-testbot1',
        username: 'testbot1',
        displayName: 'Test Bot 1'
      };
      mockedApiService.logout.mockResolvedValue(undefined);

      // Simulate a registered user
      (testInstance as any).registeredUsers = [mockUser];
      await testInstance.testLogout();

      expect(mockedApiService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Integration Test', () => {
    it('should run complete register-login flow for all bots', async () => {
      // Mock health check
      mockedApiService.healthCheck.mockResolvedValue({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
      });

      // Mock successful registrations
      for (const bot of BOT_USERS) {
        const mockUser = {
          user: {
            id: `user-${bot.username}`,
            username: bot.username,
            displayName: bot.displayName,
            avatar: null,
            bio: null,
            status: 'offline'
          }
        };
        mockedApiService.register.mockResolvedValue(mockUser);
      }

      // Mock successful logins
      for (const bot of BOT_USERS) {
        const mockLoginResponse = {
          user: {
            id: `user-${bot.username}`,
            username: bot.username,
            displayName: bot.displayName,
            avatar: null,
            bio: null,
            status: 'online'
          }
        };
        mockedApiService.login.mockResolvedValue(mockLoginResponse);
      }

      // Mock logout
      mockedApiService.logout.mockResolvedValue(undefined);

      // Mock duplicate registration error
      mockedApiService.register.mockRejectedValueOnce(
        new Error('Username already exists')
      );

      // Mock invalid login errors
      mockedApiService.login.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      // Mock password validation error
      mockedApiService.register.mockRejectedValueOnce(
        new Error('Password must be at least 6 characters')
      );

      await testInstance.runAllTests();

      // Verify all API calls were made
      expect(mockedApiService.healthCheck).toHaveBeenCalled();
      expect(mockedApiService.register).toHaveBeenCalled();
      expect(mockedApiService.login).toHaveBeenCalled();
      expect(mockedApiService.logout).toHaveBeenCalled();
    });
  });
});

// Performance test for multiple concurrent registrations
describe('Performance Tests', () => {
  it('should handle concurrent registrations efficiently', async () => {
    const startTime = Date.now();
    
    // Mock successful registrations
    mockedApiService.register.mockImplementation((username: string, _password: string, displayName?: string) => {
      return Promise.resolve({
        user: {
          id: `user-${username}`,
          username,
          displayName: displayName || username,
          avatar: null,
          bio: null,
          status: 'offline'
        }
      });
    });

    // Create multiple registration promises
    const registrationPromises = BOT_USERS.map(bot => 
      apiService.register(bot.username, bot.password, bot.displayName)
    );

    await Promise.all(registrationPromises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(1000);
    expect(mockedApiService.register).toHaveBeenCalledTimes(BOT_USERS.length);
  });
});
