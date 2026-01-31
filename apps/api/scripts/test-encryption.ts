/**
 * Test Script: Verify Encryption/Decryption Flow
 * 
 * This script tests that the encryption and decryption utilities work correctly
 * and that tokens can be properly encrypted and decrypted.
 * 
 * Usage: pnpm tsx scripts/test-encryption.ts
 */

import { encrypt, decrypt } from '../src/utils/encryption.util';

function testEncryption() {
  console.log('🔐 Testing Encryption/Decryption Flow\n');

  // Test data
  const testCases = [
    {
      name: 'GitHub Access Token',
      value: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
    },
    {
      name: 'Vercel Access Token',
      value: 'vercel_token_abc123xyz789',
    },
    {
      name: 'Webhook Secret',
      value: 'webhook_secret_super_secure_random_string_12345',
    },
    {
      name: 'Short Token',
      value: 'short123',
    },
    {
      name: 'Long Token',
      value: 'a'.repeat(500),
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`  Original: ${testCase.value.substring(0, 20)}...`);

      // Encrypt
      const encrypted = encrypt(testCase.value);
      console.log(`  Encrypted: ${encrypted.substring(0, 40)}...`);

      // Verify encrypted format (should be base64 encoded)
      if (!/^[A-Za-z0-9+/]+=*$/.test(encrypted)) {
        throw new Error(`Invalid encrypted format: not valid base64`);
      }

      // Decrypt
      const decrypted = decrypt(encrypted);
      console.log(`  Decrypted: ${decrypted.substring(0, 20)}...`);

      // Verify
      if (decrypted === testCase.value) {
        console.log(`  ✅ PASSED\n`);
        passedTests++;
      } else {
        console.log(`  ❌ FAILED: Decrypted value doesn't match original\n`);
        failedTests++;
      }
    } catch (error: any) {
      console.log(`  ❌ FAILED: ${error.message}\n`);
      failedTests++;
    }
  }

  // Test error handling
  console.log('Testing Error Handling:');
  
  try {
    console.log('  Testing invalid encrypted data...');
    decrypt('invalid:data:here');
    console.log('  ❌ FAILED: Should have thrown an error\n');
    failedTests++;
  } catch (error) {
    console.log('  ✅ PASSED: Correctly rejected invalid data\n');
    passedTests++;
  }

  try {
    console.log('  Testing malformed encrypted data...');
    decrypt('notencrypted');
    console.log('  ❌ FAILED: Should have thrown an error\n');
    failedTests++;
  } catch (error) {
    console.log('  ✅ PASSED: Correctly rejected malformed data\n');
    passedTests++;
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('═══════════════════════════════════════\n');

  if (failedTests === 0) {
    console.log('🎉 All tests passed! Encryption is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the encryption configuration.\n');
    process.exit(1);
  }
}

// Run the tests
testEncryption();
