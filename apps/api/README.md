<p align="center">
  <h1>Devovia API</h1>
</p>

## Description

This is the Express API for the Devovia platform. It provides authentication, user management, and other backend services for the Devovia web application.

## Installation

```bash
$ pnpm install
```

## Running the app locally

```bash
# development mode with hot reload
$ pnpm run dev

# production mode
$ pnpm run build
$ pnpm run start
```

## Deploying to Vercel

This API is configured to be deployed as a serverless function on Vercel. Follow these steps to deploy:

1. **Create a new Vercel project**

   ```bash
   # Install Vercel CLI if you haven't already
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from the api directory
   cd apps/api
   vercel
   ```

2. **Set up environment variables in Vercel**

   You'll need to set up the following environment variables in your Vercel project settings:

   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT token generation
   - `SESSION_SECRET`: Secret for session management
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret
   - `GITHUB_CALLBACK_URL`: The callback URL for GitHub OAuth (should be `https://your-api-url.vercel.app/api/auth/github/callback`)
   - `FRONTEND_URL`: The URL of your frontend application

3. **Update your frontend configuration**

   After deploying your API, update the `NEXT_PUBLIC_API_URL` environment variable in your Next.js app to point to your new API URL:

   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app/api
   ```

## API Documentation

The API includes the following endpoints:

- `/api/auth/register` - Register a new user
- `/api/auth/login` - Login with email/password
- `/api/auth/github` - Login with GitHub
- `/api/auth/github/callback` - GitHub OAuth callback
- `/api/hc` - Health check endpoint

## Testing

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

  Nest is [MIT licensed](LICENSE).
