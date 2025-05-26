# Deploying the Devovia API to Railway

This guide explains how to deploy the Devovia API to Railway while preserving the monorepo structure.

## Prerequisites

- A [Railway](https://railway.app/) account (you can sign up with GitHub)
- Your GitHub repository connected to Railway

## Deployment Steps

### 1. Create a New Project in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your GitHub repository

### 2. Configure the Project

1. In the project settings, set the following:

   - **Root Directory**: `apps/api`
   - **Environment**: `Node.js`

2. Add a PostgreSQL database:
   - Click "New" → "Database" → "PostgreSQL"
   - This will automatically add a `DATABASE_URL` variable to your project

### 3. Set Environment Variables

Add the following environment variables in the Railway dashboard:

```
NODE_ENV=production
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d
SESSION_SECRET=your_session_secret_key_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=https://your-api-url.railway.app/api/auth/github/callback
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Replace the placeholder values with your actual secrets and URLs.

### 4. Deploy Your API

1. Railway will automatically deploy your API when you push changes to your repository
2. You can also manually trigger a deployment from the Railway dashboard

### 5. Get Your API URL

1. After deployment, Railway will provide a URL for your API
2. Use this URL as the `NEXT_PUBLIC_API_URL` in your Next.js app

## Updating Your Next.js App

In your Next.js app, set the following environment variable:

```
NEXT_PUBLIC_API_URL=https://your-api-url.railway.app/api
```

## Troubleshooting

- **Build Errors**: Check the build logs in Railway dashboard
- **Database Connection Issues**: Verify your `DATABASE_URL` is correctly set
- **OAuth Errors**: Make sure your GitHub callback URL is correctly configured in both Railway and GitHub

## Monitoring

Railway provides basic monitoring for your API:

- CPU and memory usage
- Logs
- Deployment history

For more advanced monitoring, consider integrating with a service like Sentry or LogRocket.
