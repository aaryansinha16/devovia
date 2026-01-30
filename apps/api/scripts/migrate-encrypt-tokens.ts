/**
 * Migration Script: Encrypt Existing Plain-Text Tokens
 * 
 * This script encrypts any existing plain-text access tokens and webhook secrets
 * in the database. Run this once after deploying the encryption feature.
 * 
 * Usage: pnpm tsx scripts/migrate-encrypt-tokens.ts
 */

import prisma from '../src/lib/prisma';
import { encrypt } from '../src/utils/encryption.util';

async function migrateTokens() {
  console.log('🔒 Starting token encryption migration...\n');

  try {
    // Get all platform connections
    const connections = await prisma.platformConnection.findMany({
      select: {
        id: true,
        accessToken: true,
        refreshToken: true,
        webhookSecret: true,
      },
    });

    console.log(`Found ${connections.length} platform connections to check\n`);

    let encryptedCount = 0;
    let skippedCount = 0;

    for (const connection of connections) {
      const updates: any = {};
      let needsUpdate = false;

      // Check if accessToken looks like plain text (not encrypted format)
      // Encrypted tokens are base64 encoded and typically longer than plain tokens
      // We'll try to decrypt - if it fails, it's plain text
      if (connection.accessToken) {
        try {
          // Try to decrypt - if successful, it's already encrypted
          const { decrypt } = require('../src/utils/encryption.util');
          decrypt(connection.accessToken);
        } catch {
          // Decryption failed, so it's plain text - encrypt it
          console.log(`  Encrypting accessToken for connection ${connection.id}`);
          updates.accessToken = encrypt(connection.accessToken);
          needsUpdate = true;
        }
      }

      // Check refreshToken
      if (connection.refreshToken) {
        try {
          const { decrypt } = require('../src/utils/encryption.util');
          decrypt(connection.refreshToken);
        } catch {
          console.log(`  Encrypting refreshToken for connection ${connection.id}`);
          updates.refreshToken = encrypt(connection.refreshToken);
          needsUpdate = true;
        }
      }

      // Check webhookSecret
      if (connection.webhookSecret) {
        try {
          const { decrypt } = require('../src/utils/encryption.util');
          decrypt(connection.webhookSecret);
        } catch {
          console.log(`  Encrypting webhookSecret for connection ${connection.id}`);
          updates.webhookSecret = encrypt(connection.webhookSecret);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: updates,
        });
        encryptedCount++;
        console.log(`  ✅ Updated connection ${connection.id}\n`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`   - Encrypted: ${encryptedCount} connections`);
    console.log(`   - Skipped (already encrypted): ${skippedCount} connections`);
    console.log(`   - Total: ${connections.length} connections\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTokens();
