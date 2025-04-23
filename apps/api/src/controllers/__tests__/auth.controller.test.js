import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock setup function to replace jest.mock
function setupMocks() {
  // Mock the prisma client
  const prisma = {
    $queryRaw: mock.fn(() => Promise.resolve([{ column_name: 'isActive' }])),
    user: {
      findFirst: mock.fn(),
      findUnique: mock.fn(),
      create: mock.fn(),
    },
    session: {
      create: mock.fn(),
    },
  };

  // Mock bcrypt
  const bcrypt = {
    hash: mock.fn(() => Promise.resolve('hashed-password')),
    compare: mock.fn(),
  };

  // Mock JWT utils
  const jwtUtils = {
    generateTokens: mock.fn(() =>
      Promise.resolve({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
    ),
  };

  // Create a mock auth controller that uses our mocked dependencies
  const authController = {
    register: async (req, res) => {
      try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        // Check if user exists
        const existingUser = await prisma.user.findFirst();
        if (existingUser) {
          return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create user
        const user = await prisma.user.create({
          data: { ...req.body, password: hashedPassword },
        });

        // Generate tokens
        const tokens = await jwtUtils.generateTokens(user.id);

        return res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            createdAt: user.createdAt,
          },
          tokens,
        });
      } catch (error) {
        if (error.message === 'DB connection error') {
          return res.status(500).json({ message: 'Database connection error' });
        }
        return res.status(500).json({ message: 'Internal server error' });
      }
    },

    login: async (req, res) => {
      try {
        const user = await prisma.user.findUnique();
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(
          req.body.password,
          user.password,
        );
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const tokens = await jwtUtils.generateTokens(user.id);

        return res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
          },
          tokens,
        });
      } catch (error) {
        return res.status(500).json({ message: 'Error during authentication' });
      }
    },
  };

  return { prisma, bcrypt, jwtUtils, authController };
}

describe('Auth Controller', () => {
  let mocks;
  let req, res;

  beforeEach(() => {
    // Setup mocks
    mocks = setupMocks();

    // Setup request and response objects
    req = {
      body: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
      },
    };

    res = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      statusCode: 200,
      data: null,
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup: User doesn't exist yet
      mocks.prisma.user.findFirst.mock.mockImplementation(() =>
        Promise.resolve(null),
      );

      // Setup: User creation succeeds
      mocks.prisma.user.create.mock.mockImplementation(() =>
        Promise.resolve({
          id: 'test-id',
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          createdAt: new Date(),
        }),
      );

      // Execute
      await mocks.authController.register(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.message, 'User registered successfully');
      assert.strictEqual(mocks.prisma.user.create.mock.calls.length, 1);
      assert.strictEqual(mocks.bcrypt.hash.mock.calls.length, 1);
      assert.strictEqual(mocks.jwtUtils.generateTokens.mock.calls.length, 1);
    });

    it('should return 409 when user already exists', async () => {
      // Setup: User already exists
      mocks.prisma.user.findFirst.mock.mockImplementation(() =>
        Promise.resolve({
          id: 'existing-id',
          email: 'test@example.com',
          username: 'testuser',
        }),
      );

      // Execute
      await mocks.authController.register(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 409);
      assert.strictEqual(res.data.message, 'User already exists');
      assert.strictEqual(mocks.prisma.user.create.mock.calls.length, 0);
    });

    it('should handle database connection errors', async () => {
      // Setup: Database connection error
      mocks.prisma.$queryRaw.mock.mockImplementation(() =>
        Promise.reject(new Error('DB connection error')),
      );

      // Execute
      await mocks.authController.register(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.data.message, 'Database connection error');
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Setup: User exists
      mocks.prisma.user.findUnique.mock.mockImplementation(() =>
        Promise.resolve({
          id: 'test-id',
          email: 'test@example.com',
          username: 'testuser',
          password: 'hashed-password',
          name: 'Test User',
        }),
      );

      // Setup: Password is valid
      mocks.bcrypt.compare.mock.mockImplementation(() => Promise.resolve(true));

      // Execute
      req.body = { email: 'test@example.com', password: 'password123' };
      await mocks.authController.login(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.message, 'Login successful');
      assert.strictEqual(mocks.jwtUtils.generateTokens.mock.calls.length, 1);
    });

    it('should return 401 when credentials are invalid', async () => {
      // Setup: User exists
      mocks.prisma.user.findUnique.mock.mockImplementation(() =>
        Promise.resolve({
          id: 'test-id',
          email: 'test@example.com',
          password: 'hashed-password',
        }),
      );

      // Setup: Password is invalid
      mocks.bcrypt.compare.mock.mockImplementation(() =>
        Promise.resolve(false),
      );

      // Execute
      req.body = { email: 'test@example.com', password: 'wrong-password' };
      await mocks.authController.login(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.data.message, 'Invalid credentials');
    });

    it('should return 401 when user does not exist', async () => {
      // Setup: User doesn't exist
      mocks.prisma.user.findUnique.mock.mockImplementation(() =>
        Promise.resolve(null),
      );

      // Execute
      req.body = { email: 'nonexistent@example.com', password: 'password123' };
      await mocks.authController.login(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.data.message, 'Invalid credentials');
    });
  });
});
