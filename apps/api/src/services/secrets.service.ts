/**
 * Secrets Manager Service
 * Handles encryption, storage, and retrieval of secrets for runbooks
 */

import { PrismaClient, SecretType, RunbookEnvironment } from '@repo/database';
import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class SecretsService {
  private prisma: PrismaClient;
  private encryptionKey: Buffer;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    // Get encryption key from environment or generate a warning
    const key = process.env.SECRETS_ENCRYPTION_KEY;
    if (!key) {
      console.warn(
        '⚠️  SECRETS_ENCRYPTION_KEY not set. Using fallback key (NOT SECURE FOR PRODUCTION)',
      );
      this.encryptionKey = crypto.scryptSync(
        'fallback-key-not-secure',
        'salt',
        32,
      );
    } else {
      this.encryptionKey = crypto.scryptSync(key, 'devovia-secrets', 32);
    }
  }

  /**
   * Encrypt a secret value
   */
  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt a secret value
   */
  private decrypt(ciphertext: string): string {
    const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(
      ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
      'hex',
    );
    const encrypted = ciphertext.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a new secret
   */
  async createSecret(params: {
    name: string;
    value: string;
    type: SecretType;
    environment?: RunbookEnvironment;
    runbookId?: string;
    description?: string;
    createdBy: string;
  }): Promise<{ id: string; name: string }> {
    const encryptedValue = this.encrypt(params.value);

    const secret = await this.prisma.runbookSecret.create({
      data: {
        name: params.name,
        encryptedValue,
        type: params.type,
        environment: params.environment,
        runbookId: params.runbookId,
        description: params.description,
        createdBy: params.createdBy,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return secret;
  }

  /**
   * Get a decrypted secret value
   */
  async getSecretValue(secretId: string): Promise<string | null> {
    const secret = await this.prisma.runbookSecret.findUnique({
      where: { id: secretId },
    });

    if (!secret) {
      return null;
    }

    return this.decrypt(secret.encryptedValue);
  }

  /**
   * Get secret by name for a specific environment
   */
  async getSecretByName(
    name: string,
    environment?: RunbookEnvironment,
    runbookId?: string,
  ): Promise<string | null> {
    const secret = await this.prisma.runbookSecret.findFirst({
      where: {
        name,
        environment,
        OR: [
          { runbookId },
          { runbookId: null }, // Organization-wide secrets
        ],
      },
      orderBy: {
        // Prefer runbook-specific secrets over org-wide
        runbookId: 'desc',
      },
    });

    if (!secret) {
      return null;
    }

    return this.decrypt(secret.encryptedValue);
  }

  /**
   * List secrets (without values) for a runbook or organization
   */
  async listSecrets(params: {
    runbookId?: string;
    environment?: RunbookEnvironment;
  }): Promise<
    Array<{
      id: string;
      name: string;
      type: SecretType;
      environment: RunbookEnvironment | null;
      description: string | null;
      version: number;
      createdAt: Date;
    }>
  > {
    const where: any = {};

    if (params.runbookId) {
      where.OR = [
        { runbookId: params.runbookId },
        { runbookId: null }, // Include org-wide secrets
      ];
    }

    if (params.environment) {
      where.environment = params.environment;
    }

    const secrets = await this.prisma.runbookSecret.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        environment: true,
        description: true,
        version: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return secrets;
  }

  /**
   * Update a secret value (rotate)
   */
  async rotateSecret(secretId: string, newValue: string): Promise<void> {
    const encryptedValue = this.encrypt(newValue);

    await this.prisma.runbookSecret.update({
      where: { id: secretId },
      data: {
        encryptedValue,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Delete a secret
   */
  async deleteSecret(secretId: string): Promise<void> {
    await this.prisma.runbookSecret.delete({
      where: { id: secretId },
    });
  }

  /**
   * Get all secrets for execution context (decrypted)
   */
  async getSecretsForExecution(
    runbookId: string,
    environment?: RunbookEnvironment,
  ): Promise<Record<string, string>> {
    const secrets = await this.prisma.runbookSecret.findMany({
      where: {
        environment,
        OR: [
          { runbookId },
          { runbookId: null }, // Organization-wide secrets
        ],
      },
    });

    const decryptedSecrets: Record<string, string> = {};

    for (const secret of secrets) {
      try {
        decryptedSecrets[secret.name] = this.decrypt(secret.encryptedValue);
      } catch (error) {
        console.error(`Failed to decrypt secret ${secret.name}:`, error);
      }
    }

    return decryptedSecrets;
  }

  /**
   * Check if a secret name is available
   */
  async isNameAvailable(
    name: string,
    environment?: RunbookEnvironment,
    runbookId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.runbookSecret.findFirst({
      where: {
        name,
        environment,
        runbookId: runbookId || null,
      },
    });

    return !existing;
  }
}

export default SecretsService;
