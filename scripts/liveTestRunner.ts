#!/usr/bin/env ts-node

/**
 * Live test runner for register-login flow
 * Run with: ts-node scripts/liveTestRunner.ts
 */

import { RegisterLoginTest } from './src/tests/registerLoginTest.ts';

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    console.log('✅ Server is healthy:', data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the server with: npm run dev:server');
    return false;
  }
}

async function runLiveTests(): Promise<void> {
  console.log('🚀 Starting Live Register-Login Tests for Bot Accounts\n');
  
  // Check if server is running
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  // Run the tests
  const test = new RegisterLoginTest();
  
  try {
    await test.runAllTests();
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test execution interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Test execution terminated');
  process.exit(0);
});

// Run the tests
runLiveTests();
