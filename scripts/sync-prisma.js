/**
 * Script to synchronize Prisma schema and migrations between the shared database package
 * and the API package.
 *
 * This ensures that the API package has the correct schema and migrations for deployment
 * while maintaining the shared database package as the single source of truth.
 */
const fs = require("fs");
const path = require("path");
// No child_process import needed for now

// Define paths
const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_SCHEMA_PATH = path.join(
  ROOT_DIR,
  "packages/database/prisma/schema.prisma",
);
const TARGET_SCHEMA_PATH = path.join(ROOT_DIR, "apps/api/prisma/schema.prisma");
const SOURCE_MIGRATIONS_PATH = path.join(
  ROOT_DIR,
  "packages/database/prisma/migrations",
);
const TARGET_MIGRATIONS_PATH = path.join(
  ROOT_DIR,
  "apps/api/prisma/migrations",
);

// Ensure target directories exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Copy file with proper error handling
function copyFile(source, target) {
  try {
    fs.copyFileSync(source, target);
    console.log(`Copied: ${source} -> ${target}`);
    return true;
  } catch (error) {
    console.error(`Error copying ${source} to ${target}:`, error);
    return false;
  }
}

// Copy directory recursively
function copyDirectory(source, target) {
  ensureDirectoryExists(target);

  let success = true;
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      if (!copyDirectory(sourcePath, targetPath)) {
        success = false;
      }
    } else {
      if (!copyFile(sourcePath, targetPath)) {
        success = false;
      }
    }
  }

  return success;
}

// Main function to sync Prisma files
function syncPrisma() {
  console.log("Starting Prisma schema and migrations synchronization...");

  // Ensure target directories exist
  ensureDirectoryExists(path.dirname(TARGET_SCHEMA_PATH));
  ensureDirectoryExists(TARGET_MIGRATIONS_PATH);

  // Copy schema
  const schemaSuccess = copyFile(SOURCE_SCHEMA_PATH, TARGET_SCHEMA_PATH);

  // Copy migrations
  const migrationsSuccess = copyDirectory(
    SOURCE_MIGRATIONS_PATH,
    TARGET_MIGRATIONS_PATH,
  );

  if (schemaSuccess && migrationsSuccess) {
    console.log("Prisma synchronization completed successfully!");
    return true;
  } else {
    console.error("Prisma synchronization completed with errors.");
    return false;
  }
}

// Check if schemas are different
function areSchemaDifferent() {
  if (
    !fs.existsSync(SOURCE_SCHEMA_PATH) ||
    !fs.existsSync(TARGET_SCHEMA_PATH)
  ) {
    return true; // If either file doesn't exist, consider them different
  }

  const sourceSchema = fs.readFileSync(SOURCE_SCHEMA_PATH, "utf8");
  const targetSchema = fs.readFileSync(TARGET_SCHEMA_PATH, "utf8");

  return sourceSchema !== targetSchema;
}

// Run the sync
const needsSync = areSchemaDifferent();
if (needsSync) {
  console.log("Schemas are different or missing. Synchronizing...");
  const success = syncPrisma();
  process.exit(success ? 0 : 1);
} else {
  console.log("Schemas are already in sync. No action needed.");
  process.exit(0);
}
