# API Testing Documentation

This document provides comprehensive information about the API testing suite for the Gnoseon chat application.

## Overview

The testing suite is designed to catch bugs without needing to check the browser manually. It covers:
- Database API operations
- React component behavior
- Authentication flow
- Integration tests for complete user flows
- Error handling and edge cases

## Testing Framework Setup

### Dependencies
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **User Event**: Advanced user interaction simulation
- **Jest DOM**: Custom DOM matchers for React

### Configuration
- **jest.config.js**: Main Jest configuration
- **src/tests/setup.ts**: Global test setup with mocks

## Test Structure

### 1. Database API Tests (`src/tests/database.test.ts`)
Tests all database operations including:
- User management (create, validate, retrieve)
- Message management (create, retrieve, mark as read)
- Chat management (create, update, retrieve)
- Data integrity and edge cases

**Key Test Cases:**
```bash
npm test -- database.test.ts
```

### 2. Authentication Hook Tests (`src/tests/useAuth.test.tsx`)
Tests the authentication system:
- Login/logout functionality
- LocalStorage integration
- Error handling
- Context provider behavior

**Key Test Cases:**
```bash
npm test -- useAuth.test.tsx
```

### 3. Component Tests
Individual component testing:

#### Header Component (`src/tests/Header.test.tsx`)
- User information display
- Tab navigation
- Logout functionality
- Avatar handling

#### ChatSidebar Component (`src/tests/ChatSidebar.test.tsx`)
- Contact list rendering
- Chat selection
- Search functionality
- Unread message indicators

#### ChatView Component (`src/tests/ChatView.test.tsx`)
- Message display
- Message sending
- Input handling
- Empty states

### 4. App Integration Tests (`src/tests/App.test.tsx`)
Tests the main application:
- Login flow
- Tab switching
- Message handling
- Mobile responsiveness

### 5. Full Integration Tests (`src/tests/integration.test.tsx`)
End-to-end testing:
- Complete user journeys
- Data synchronization
- Error handling
- Performance scenarios
- Accessibility

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Running Specific Tests
```bash
# Run specific test file
npm test -- database.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create"

# Run tests in a specific directory
npm test -- src/tests/components/
```

## Test Coverage

The test suite aims for 70% coverage across:
- Functions: 70%
- Statements: 70%
- Branches: 70%
- Lines: 70%

Coverage reports are generated in the `coverage/` directory.

## Mock Strategy

### Database Mocking
The database is mocked to provide predictable test data:
```javascript
const mockDb = {
  getAllUsers: jest.fn(),
  getChatsForUser: jest.fn(),
  createMessage: jest.fn(),
  // ... other methods
};
```

### LocalStorage Mocking
LocalStorage is mocked to prevent side effects:
```javascript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

### Browser API Mocking
Browser APIs are mocked for consistent testing:
- `window.matchMedia`
- `ResizeObserver`
- `IntersectionObserver`

## Test Data Management

### Fixtures
Test data is defined in fixtures for consistency:
```javascript
const mockUsers = [
  {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    // ...
  }
];
```

### Cleanup
Each test cleans up after itself:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow the "should" pattern
- Include the expected behavior

### 2. Test Structure
- Arrange: Set up test data
- Act: Perform the action
- Assert: Verify the result

### 3. Async Testing
- Use `waitFor` for async operations
- Handle promises properly
- Mock async dependencies

### 4. Component Testing
- Test behavior, not implementation
- Use user-centric testing
- Avoid testing internal state

## Error Handling Tests

The test suite specifically covers:
- Database connection failures
- Invalid user credentials
- Network errors
- Corrupted local storage
- Missing required data

## Performance Tests

Performance scenarios include:
- Large chat lists (100+ chats)
- Rapid message sending
- Tab switching efficiency
- Memory leak prevention

## Accessibility Tests

Accessibility is tested for:
- Keyboard navigation
- Screen reader compatibility
- ARIA label presence
- Focus management

## Continuous Integration

For CI/CD pipelines:
```bash
npm run test:ci
```
This command:
- Runs all tests once
- Generates coverage reports
- Fails on test failures
- Outputs results in CI format

## Debugging Tests

### Common Issues
1. **Mock Not Called**: Check if mock is properly configured
2. **Async Timeout**: Use `waitFor` instead of `setTimeout`
3. **Component Not Found**: Check component exports and imports

### Debug Commands
```bash
# Run tests with debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with verbose output
npm test -- --verbose database.test.ts
```

## Adding New Tests

When adding new features:
1. Write unit tests for individual functions
2. Write component tests for UI components
3. Add integration tests for user flows
4. Update coverage expectations if needed

### Test Template
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do expected behavior', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Troubleshooting

### Common Test Failures
1. **Import Errors**: Check module paths and exports
2. **Mock Errors**: Verify mock configuration
3. **Async Issues**: Use proper async/await patterns
4. **DOM Issues**: Check component rendering

### Solutions
- Check test console output
- Verify mock implementations
- Use `screen.debug()` for DOM inspection
- Check network requests in test environment

## Maintenance

### Regular Tasks
- Update test dependencies
- Review coverage reports
- Refactor test code
- Update documentation

### When Code Changes
- Update related tests
- Add new tests for new features
- Remove obsolete tests
- Update mocks if needed

This comprehensive testing suite ensures that bugs are caught early in the development process, reducing the need for manual browser testing while maintaining high code quality and reliability.
