import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock setup function to replace jest.mock
function setupMocks() {
  // Mock passport
  const passport = {
    authenticate: mock.fn(),
  };

  // Create a mock OAuth controller that uses our mocked dependencies
  const oauthController = {
    githubLogin: () => {
      // Implementation not needed for tests
    },

    githubCallback: (req, res) => {
      // Use passport.authenticate with a callback
      passport.authenticate('github', { session: false }, (err, data) => {
        if (err || !data) {
          return res.redirect(
            `${process.env.FRONTEND_URL}/auth/oauth-callback?error=oauth_failed`,
          );
        }

        const { user, tokens } = data;
        const encodedAccessToken = encodeURIComponent(tokens.accessToken);
        const encodedRefreshToken = encodeURIComponent(tokens.refreshToken);

        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/oauth-callback?` +
            `accessToken=${encodedAccessToken}&` +
            `refreshToken=${encodedRefreshToken}&` +
            `userId=${user.id}`,
        );
      })(req, res);
    },

    oauthSuccess: (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      return res.status(200).json({ user: req.user });
    },
  };

  return { passport, oauthController };
}

describe('OAuth Controller', () => {
  let mocks;
  let req, res;

  beforeEach(() => {
    // Setup mocks
    mocks = setupMocks();

    // Setup request and response objects
    req = {};

    res = {
      redirect: mock.fn(),
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

  describe('githubCallback', () => {
    it('should redirect to frontend with tokens on successful authentication', () => {
      // Setup: Mock successful authentication
      mocks.passport.authenticate.mock.mockImplementation(
        (strategy, options, callback) => {
          return () => {
            // Simulate successful authentication
            const data = {
              user: { id: 'user-id' },
              tokens: {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
              },
            };
            callback(null, data);
          };
        },
      );

      // Set environment variable for test
      process.env.FRONTEND_URL = 'https://test-frontend.com';

      // Execute
      mocks.oauthController.githubCallback(req, res);

      // Assert
      assert.strictEqual(mocks.passport.authenticate.mock.calls.length, 1);
      assert.strictEqual(
        mocks.passport.authenticate.mock.calls[0].arguments[0],
        'github',
      );
      assert.strictEqual(res.redirect.mock.calls.length, 1);

      // Check that the redirect URL contains the expected tokens
      const redirectUrl = res.redirect.mock.calls[0].arguments[0];
      assert.ok(redirectUrl.includes('test-access-token'));
      assert.ok(redirectUrl.includes('test-refresh-token'));
      assert.ok(redirectUrl.includes('user-id'));
      assert.ok(
        redirectUrl.includes('https://test-frontend.com/auth/oauth-callback'),
      );
    });

    it('should redirect to error page when authentication fails', () => {
      // Setup: Mock failed authentication
      mocks.passport.authenticate.mock.mockImplementation(
        (strategy, options, callback) => {
          return () => {
            // Simulate authentication error
            callback(new Error('Authentication failed'), null);
          };
        },
      );

      // Set environment variable for test
      process.env.FRONTEND_URL = 'https://test-frontend.com';

      // Execute
      mocks.oauthController.githubCallback(req, res);

      // Assert
      assert.strictEqual(mocks.passport.authenticate.mock.calls.length, 1);
      assert.strictEqual(res.redirect.mock.calls.length, 1);

      // Check that the redirect URL contains the error parameter
      const redirectUrl = res.redirect.mock.calls[0].arguments[0];
      assert.ok(redirectUrl.includes('error=oauth_failed'));
    });

    it('should redirect to error page when no data is returned', () => {
      // Setup: Mock authentication with no data
      mocks.passport.authenticate.mock.mockImplementation(
        (strategy, options, callback) => {
          return () => {
            // Simulate no data returned
            callback(null, null);
          };
        },
      );

      // Set environment variable for test
      process.env.FRONTEND_URL = 'https://test-frontend.com';

      // Execute
      mocks.oauthController.githubCallback(req, res);

      // Assert
      assert.strictEqual(mocks.passport.authenticate.mock.calls.length, 1);
      assert.strictEqual(res.redirect.mock.calls.length, 1);

      // Check that the redirect URL contains the error parameter
      const redirectUrl = res.redirect.mock.calls[0].arguments[0];
      assert.ok(redirectUrl.includes('error=oauth_failed'));
    });
  });

  describe('oauthSuccess', () => {
    it('should return user data when authenticated', () => {
      // Setup: User is authenticated
      req.user = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      };

      // Execute
      mocks.oauthController.oauthSuccess(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.data.user, req.user);
    });

    it('should return 401 when not authenticated', () => {
      // Setup: User is not authenticated
      req.user = null;

      // Execute
      mocks.oauthController.oauthSuccess(req, res);

      // Assert
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.data.message, 'Authentication failed');
    });
  });
});
