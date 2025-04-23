import { Request, Response } from 'express';
import passport from 'passport';

// GitHub OAuth login
export const githubLogin = passport.authenticate('github', { session: false });

// GitHub OAuth callback
export const githubCallback = (req: Request, res: Response) => {
  passport.authenticate('github', { session: false }, (err, data) => {
    if (err) {
      console.error('GitHub OAuth error:', err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/oauth-callback?error=oauth_failed`,
      );
    }

    if (!data) {
      console.error('No data returned from GitHub OAuth');
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/oauth-callback?error=oauth_failed`,
      );
    }

    const { user, tokens } = data;

    // Encode tokens to make them URL-safe
    const encodedAccessToken = encodeURIComponent(tokens.accessToken);
    const encodedRefreshToken = encodeURIComponent(tokens.refreshToken);

    // Construct the redirect URL
    const redirectUrl =
      `${process.env.FRONTEND_URL}/auth/oauth-callback?` +
      `accessToken=${encodedAccessToken}&` +
      `refreshToken=${encodedRefreshToken}&` +
      `userId=${user.id}`;

    // Log the redirect URL for debugging
    console.log('OAuth redirect URL:', redirectUrl);

    // Redirect to frontend with tokens
    return res.redirect(redirectUrl);
  })(req, res);
};

// OAuth success handler (for API response)
export const oauthSuccess = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  return res.status(200).json({
    message: 'Authentication successful',
    user: req.user,
  });
};
