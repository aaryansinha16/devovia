import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from '../lib/prisma';
import { oauthConfig } from './oauth.config';
import { generateTokens } from '../utils/jwt.utils';

// Configure GitHub OAuth strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: oauthConfig.github.clientID,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: oauthConfig.github.callbackURL,
      scope: oauthConfig.github.scope,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this GitHub ID
        let user = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });

        if (!user) {
          // Check if user exists with the same email
          const emails = profile.emails || [];
          const primaryEmail = emails.length > 0 ? emails[0].value : null;

          if (primaryEmail) {
            user = await prisma.user.findUnique({
              where: { email: primaryEmail },
            });

            if (user) {
              // Link GitHub account to existing user
              user = await prisma.user.update({
                where: { id: user.id },
                data: { githubId: profile.id },
              });
            }
          }

          // If user still doesn't exist, create a new one
          if (!user) {
            // Generate a unique username based on GitHub username
            let username = profile.username || '';

            // Check if username exists
            const existingUser = await prisma.user.findUnique({
              where: { username },
            });

            // If username exists, append a random string
            if (existingUser) {
              username = `${username}${Math.floor(Math.random() * 10000)}`;
            }

            // Create new user
            user = await prisma.user.create({
              data: {
                email: primaryEmail || `${profile.id}@github.user`,
                name: profile.displayName || username,
                username,
                githubId: profile.id,
                githubUrl: profile._json.html_url,
                avatar: profile._json.avatar_url,
                bio: profile._json.bio,
                isVerified: true, // Auto-verify OAuth users
              },
            });
          }
        }

        // Generate JWT tokens
        const tokens = await generateTokens(user.id);

        // Create session with minimal required fields to ensure compatibility
        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              token: tokens.refreshToken,
              userAgent: 'GitHub OAuth',
              ipAddress: '0.0.0.0',
              // Only include the minimum required fields
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          });
          console.log('Session created successfully with minimal fields');
        } catch (sessionError) {
          // Log the error but continue with authentication
          console.error(
            'Error creating session during GitHub OAuth, but continuing:',
            sessionError,
          );
          // Don't throw the error - we want the authentication to succeed even if session creation fails
        }

        // Return user and tokens
        return done(null, { user, tokens });
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error as Error);
      }
    },
  ),
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
