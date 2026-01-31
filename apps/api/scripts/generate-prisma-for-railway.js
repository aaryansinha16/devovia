/**
 * Script to generate Prisma client for Railway deployment
 * This script handles the different file structures in Railway's Nixpacks environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure prisma directory exists
const prismaDirPath = path.join(__dirname, '../prisma');
if (!fs.existsSync(prismaDirPath)) {
  console.log('Creating prisma directory...');
  fs.mkdirSync(prismaDirPath, { recursive: true });
}

// Possible paths to the schema file in different environments
const possibleSchemaPaths = [
  // Monorepo structure (local development)
  path.join(__dirname, '../../../packages/database/prisma/schema.prisma'),
  // Railway deployment structure (when deployed from repo root)
  path.join(__dirname, '../../database/prisma/schema.prisma'),
  // Railway Nixpacks structure
  '/app/packages/database/prisma/schema.prisma',
  // Fallback to existing schema if already copied
  path.join(__dirname, '../prisma/schema.prisma')
];

// Find the first path that exists
let schemaPath = null;
for (const possiblePath of possibleSchemaPaths) {
  console.log(`Checking for schema at: ${possiblePath}`);
  if (fs.existsSync(possiblePath)) {
    schemaPath = possiblePath;
    console.log(`Found schema at: ${schemaPath}`);
    break;
  }
}

if (!schemaPath) {
  console.error('Could not find Prisma schema file in any of the expected locations.');
  process.exit(1);
}

// Copy the schema to the API package's prisma directory
const targetSchemaPath = path.join(prismaDirPath, 'schema.prisma');
if (schemaPath !== targetSchemaPath) {
  console.log(`Copying schema from ${schemaPath} to ${targetSchemaPath}`);
  fs.copyFileSync(schemaPath, targetSchemaPath);
}

// Sync migrations from database package
const migrationsSourcePath = path.join(path.dirname(schemaPath), 'migrations');
const migrationsTargetPath = path.join(prismaDirPath, 'migrations');
if (fs.existsSync(migrationsSourcePath)) {
  console.log(
    `Syncing migrations from ${migrationsSourcePath} to ${migrationsTargetPath}`,
  );
  fs.rmSync(migrationsTargetPath, { recursive: true, force: true });
  fs.cpSync(migrationsSourcePath, migrationsTargetPath, { recursive: true });
} else {
  console.warn(`Migrations not found at ${migrationsSourcePath}`);
}

// Generate the Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully.');
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
}
