const { describe, it, mock, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Import the functions from the sync-prisma script
// We need to use require here since the script uses CommonJS
const syncPrismaPath = path.join(__dirname, "..", "sync-prisma.js");
const syncPrisma = require(syncPrismaPath);

// Mock the file system functions
mock.method(fs, "readFileSync");
mock.method(fs, "writeFileSync");
mock.method(fs, "copyFileSync");
mock.method(fs, "existsSync");
mock.method(fs, "readdirSync");
mock.method(fs, "mkdirSync");

describe("Prisma Schema Synchronization", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.reset();
  });

  it("should detect when schemas are in sync", () => {
    // Setup: Both schemas have the same content
    mock.method(fs, "existsSync", () => true);
    mock.method(fs, "readFileSync", () => "schema content");

    // Execute
    const result = syncPrisma.checkSchemasInSync();

    // Assert
    assert.strictEqual(result, true);
  });

  it("should detect when schemas are out of sync", () => {
    // Setup: Schemas have different content
    mock.method(fs, "existsSync", () => true);
    let callCount = 0;
    mock.method(fs, "readFileSync", () => {
      callCount++;
      return callCount === 1 ? "schema content 1" : "schema content 2";
    });

    // Execute
    const result = syncPrisma.checkSchemasInSync();

    // Assert
    assert.strictEqual(result, false);
  });

  it("should sync schemas when they are out of sync", () => {
    // Setup: Source schema exists, destination schema exists but is different
    mock.method(fs, "existsSync", () => true);
    let readCount = 0;
    mock.method(fs, "readFileSync", () => {
      readCount++;
      return readCount === 1 ? "source schema" : "destination schema";
    });

    const writeFileSpy = mock.method(fs, "writeFileSync");

    // Execute
    syncPrisma.syncSchemas();

    // Assert: writeFileSync should be called with the source schema content
    assert.strictEqual(writeFileSpy.mock.calls.length, 1);
    assert.strictEqual(
      writeFileSpy.mock.calls[0].arguments[1],
      "source schema",
    );
  });

  it("should create destination directory if it does not exist", () => {
    // Setup: Destination directory does not exist
    let existsSyncCalls = 0;
    mock.method(fs, "existsSync", () => {
      existsSyncCalls++;
      // First call checks if source schema exists (yes)
      // Second call checks if destination directory exists (no)
      return existsSyncCalls === 1;
    });

    mock.method(fs, "readFileSync", () => "source schema");
    const mkdirSpy = mock.method(fs, "mkdirSync");

    // Execute
    syncPrisma.syncSchemas();

    // Assert: mkdirSync should be called to create the destination directory
    assert.strictEqual(mkdirSpy.mock.calls.length, 1);
  });

  it("should copy migrations from source to destination", () => {
    // Setup: Source and destination schemas exist and are different
    mock.method(fs, "existsSync", () => true);
    mock.method(fs, "readFileSync", () => "schema content");
    mock.method(fs, "readdirSync", () => ["migration1", "migration2"]);

    const copyFileSpy = mock.method(fs, "copyFileSync");

    // Execute
    syncPrisma.syncMigrations();

    // Assert: copyFileSync should be called for each migration
    assert.strictEqual(copyFileSpy.mock.calls.length, 2);
  });
});
