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

// Determine the schema path based on environment
let schemaPath;

// Try multiple possible paths to find the schema
const possiblePaths = [
  // Path from API package to database package in monorepo
  path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma'),
  // Path within the API package
  path.resolve(process.cwd(), './prisma/schema.prisma'),
  // GitHub Actions path (from root of repo)
  path.resolve(process.cwd(), '../database/prisma/schema.prisma'),
];

// Find the first path that exists
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    schemaPath = possiblePath;
    break;
  }
}

// If no path was found, default to the standard monorepo path
if (!schemaPath) {
  schemaPath = path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma');
}

// eslint-disable-next-line no-console
console.log(`Using Prisma schema at: ${schemaPath}`);
module.exports = { schemaPath };
