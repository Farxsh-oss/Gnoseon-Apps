// Bot user data for testing
const BOT_USERS = [
  {
    username: 'testbot1',
    password: 'botpass123',
    displayName: 'Test Bot 1'
  },
  {
    username: 'testbot2',
    password: 'botpass456',
    displayName: 'Test Bot 2'
  },
  {
    username: 'testbot3',
    password: 'botpass789',
    displayName: 'Test Bot 3'
  },
  {
    username: 'smartbot4',
    password: 'smartpass123',
    displayName: 'Smart Bot 4'
  },
  {
    username: 'assistantbot5',
    password: 'assistpass456',
    displayName: 'Assistant Bot 5'
  }
];

// Test results interface
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

// Simple API service for Node.js environment
class NodeApiService {
  private baseUrl = 'http://localhost:3001/api';

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response;
  }

  async healthCheck() {
    const response = await this.request('/health');
    return response.json();
  }

  async register(username: string, password: string, displayName?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    });

    const data = await response.json();
    return data;
  }

  async login(username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  }

  async logout(userId: string) {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}

// Test class for register-login flow
class RegisterLoginTest {
  private results: TestResult[] = [];
  private registeredUsers: any[] = [];
  private apiService = new NodeApiService();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Register-Login Flow Tests for Bot Accounts\n');

    // Test 1: Health Check
    await this.testHealthCheck();

    // Test 2: Register all bot users
    await this.testRegisterMultipleUsers();

    // Test 3: Login with each registered user
    await this.testLoginMultipleUsers();

    // Test 4: Test duplicate registration (should fail)
    await this.testDuplicateRegistration();

    // Test 5: Test invalid login (should fail)
    await this.testInvalidLogin();

    // Test 6: Test password validation
    await this.testPasswordValidation();

    // Test 7: Test logout functionality
    await this.testLogout();

    // Display results
    this.displayResults();
  }

  async testHealthCheck(): Promise<void> {
    console.log('📋 Test 1: Health Check');
    try {
      const result = await this.apiService.healthCheck();
      this.addResult(true, 'Health check passed', result);
      console.log('✅ Server is healthy');
    } catch (error) {
      this.addResult(false, 'Health check failed', null, error);
      console.log('❌ Server health check failed');
    }
    console.log('');
  }

  async testRegisterMultipleUsers(): Promise<void> {
    console.log('📋 Test 2: Register Multiple Bot Users');
    
    for (const bot of BOT_USERS) {
      try {
        console.log(`🔹 Registering ${bot.username}...`);
        const result = await this.apiService.register(bot.username, bot.password, bot.displayName);
        this.registeredUsers.push(result.user);
        this.addResult(true, `Successfully registered ${bot.username}`, result.user);
        console.log(`✅ ${bot.username} registered successfully`);
      } catch (error: any) {
        if (error.message.includes('Username already exists')) {
          console.log(`⚠️  ${bot.username} already exists, skipping...`);
          this.addResult(true, `${bot.username} already exists (expected)`, null);
        } else {
          this.addResult(false, `Failed to register ${bot.username}`, null, error);
          console.log(`❌ Failed to register ${bot.username}: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  async testLoginMultipleUsers(): Promise<void> {
    console.log('📋 Test 3: Login Multiple Bot Users');
    
    for (const bot of BOT_USERS) {
      try {
        console.log(`🔹 Logging in ${bot.username}...`);
        const result = await this.apiService.login(bot.username, bot.password);
        this.addResult(true, `Successfully logged in ${bot.username}`, result.user);
        console.log(`✅ ${bot.username} logged in successfully`);
        console.log(`   User ID: ${result.user.id}`);
        console.log(`   Display Name: ${result.user.displayName}`);
        console.log(`   Status: ${result.user.status}`);
      } catch (error: any) {
        this.addResult(false, `Failed to login ${bot.username}`, null, error);
        console.log(`❌ Failed to login ${bot.username}: ${error.message}`);
      }
    }
    console.log('');
  }

  async testDuplicateRegistration(): Promise<void> {
    console.log('📋 Test 4: Duplicate Registration (Should Fail)');
    
    const firstBot = BOT_USERS[0];
    try {
      console.log(`🔹 Attempting duplicate registration for ${firstBot.username}...`);
      await this.apiService.register(firstBot.username, 'newpass123', 'New Name');
      this.addResult(false, 'Duplicate registration should have failed', null, 'Expected error but got success');
      console.log('❌ Duplicate registration unexpectedly succeeded');
    } catch (error: any) {
      if (error.message.includes('Username already exists') || error.message.includes('HTTP 409')) {
        this.addResult(true, 'Duplicate registration correctly failed', error.message);
        console.log('✅ Duplicate registration correctly rejected');
      } else {
        this.addResult(false, 'Unexpected error in duplicate registration', null, error);
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    console.log('');
  }

  async testInvalidLogin(): Promise<void> {
    console.log('📋 Test 5: Invalid Login (Should Fail)');
    
    const testCases = [
      { username: 'nonexistentuser', password: 'anypassword' },
      { username: BOT_USERS[0].username, password: 'wrongpassword' },
      { username: '', password: 'anypassword' },
      { username: BOT_USERS[0].username, password: '' }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`🔹 Testing invalid login: ${testCase.username || '(empty)'}/${testCase.password || '(empty)'}`);
        await this.apiService.login(testCase.username, testCase.password);
        this.addResult(false, `Invalid login should have failed for ${testCase.username}`, null, 'Expected error but got success');
        console.log('❌ Invalid login unexpectedly succeeded');
      } catch (error: any) {
        if (error.message.includes('Invalid credentials') || error.message.includes('HTTP 401') || error.message.includes('required') || error.message.includes('HTTP 400')) {
          this.addResult(true, `Invalid login correctly rejected for ${testCase.username}`, error.message);
          console.log('✅ Invalid login correctly rejected');
        } else {
          this.addResult(false, 'Unexpected error in invalid login', null, error);
          console.log(`❌ Unexpected error: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  async testPasswordValidation(): Promise<void> {
    console.log('📋 Test 6: Password Validation');
    
    const testCases = [
      { username: 'shortpassbot', password: '123', displayName: 'Short Pass Bot' },
      { username: 'validpassbot', password: 'validpass123', displayName: 'Valid Pass Bot' }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`🔹 Testing password validation for ${testCase.username}...`);
        const result = await this.apiService.register(testCase.username, testCase.password, testCase.displayName);
        if (testCase.password.length < 6) {
          this.addResult(false, 'Short password should have been rejected', null, 'Expected error but got success');
          console.log('❌ Short password unexpectedly accepted');
        } else {
          this.addResult(true, 'Valid password accepted', result.user);
          console.log('✅ Valid password correctly accepted');
        }
      } catch (error: any) {
        if ((error.message.includes('Password must be at least 6 characters') || error.message.includes('HTTP 400')) && testCase.password.length < 6) {
          this.addResult(true, 'Short password correctly rejected', error.message);
          console.log('✅ Short password correctly rejected');
        } else if (testCase.password.length >= 6) {
          this.addResult(false, 'Valid password was rejected', null, error);
          console.log(`❌ Valid password was rejected: ${error.message}`);
        } else {
          this.addResult(false, 'Unexpected error in password validation', null, error);
          console.log(`❌ Unexpected error: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  async testLogout(): Promise<void> {
    console.log('📋 Test 7: Logout Functionality');
    
    if (this.registeredUsers.length > 0) {
      const testUser = this.registeredUsers[0];
      try {
        console.log(`🔹 Testing logout for ${testUser.username}...`);
        await this.apiService.logout(testUser.id);
        this.addResult(true, 'Logout successful', testUser);
        console.log('✅ Logout successful');
      } catch (error: any) {
        this.addResult(false, 'Logout failed', null, error);
        console.log(`❌ Logout failed: ${error.message}`);
      }
    } else {
      this.addResult(false, 'No users available for logout test', null, 'No registered users');
      console.log('⚠️  No users available for logout test');
    }
    console.log('');
  }

  private addResult(success: boolean, message: string, data?: any, error?: any): void {
    this.results.push({ success, message, data, error });
  }

  private displayResults(): void {
    console.log('=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.message}`);
          if (result.error) {
            console.log(`   Error: ${result.error.message || result.error}`);
          }
        });
      console.log('');
    }

    console.log('✅ PASSED TESTS:');
    this.results
      .filter(r => r.success)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.message}`);
      });

    console.log('');
    console.log('🤖 BOT USERS CREATED:');
    this.registeredUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.displayName}) - ID: ${user.id}`);
    });

    console.log('');
    console.log('=' .repeat(60));
    console.log('🏁 TESTING COMPLETE');
    console.log('=' .repeat(60));
  }
}

// Export for use in test files
export { RegisterLoginTest, BOT_USERS };
