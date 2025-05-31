/**
 * This file helps resolve the Prisma schema path in different environments
 * It's used by the Prisma CLI to find the schema file
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Check if we're in the Railway environment
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'true';

// In Railway, the monorepo is cloned to the root directory
// So we need to use a different path
let schemaPath;

if (isRailway) {
  // In Railway, the schema is at the root level in packages/database
  schemaPath = path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma');
  
  // If the file doesn't exist at that path, try the local schema
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), './prisma/schema.prisma');
  }
} else {
  // In local development, use the schema from the database package
  schemaPath = path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma');
}

// eslint-disable-next-line no-console
console.log(`Using Prisma schema at: ${schemaPath}`);
module.exports = { schemaPath };
