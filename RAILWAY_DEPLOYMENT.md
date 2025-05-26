# Deploying to Railway with GitHub Actions

This project uses GitHub Actions to deploy the API to Railway. This approach preserves the monorepo structure without duplicating any files.

## Setup Instructions

### 1. Generate a Railway Token

1. Install the Railway CLI locally:

   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:

   ```bash
   railway login
   ```

3. Generate a token:

   ```bash
   railway login --browserless
   ```

   This will output a token that you'll need for GitHub Actions.

### 2. Add the Required Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:

   a. **RAILWAY_TOKEN**

   - Name: `RAILWAY_TOKEN`
   - Value: [The token you generated in step 1]

   b. **RAILWAY_PROJECT_ID**

   - Name: `RAILWAY_PROJECT_ID`
   - Value: `091b1de7-3a3a-4cb4-83c4-f33fc23d9b35`

### 3. Link Your Existing Railway Project

1. After merging to main, navigate to your API directory:

   ```bash
   cd apps/api
   ```

2. Link your local repository to your existing Railway project:

   ```bash
   railway link
   ```

   (Select your existing project when prompted)

3. Make sure your PostgreSQL database is properly set up in your Railway project

### 4. Update the GitHub Actions Workflow (if needed)

If your Railway project or service name is different from the defaults in the workflow file, update the `.github/workflows/deploy-api.yml` file accordingly.

## How It Works

The GitHub Actions workflow:

1. Runs whenever changes are pushed to the `main` branch that affect the API or database packages
2. Sets up Node.js and pnpm
3. Installs dependencies for the entire monorepo
4. Generates the Prisma client from the schema in the database package
5. Builds the API
6. Deploys the built API to Railway

## Environment Variables

Make sure to set up the following environment variables in your Railway project:

- `DATABASE_URL`: This should be automatically set by Railway when you add a PostgreSQL database
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_REFRESH_SECRET`: Secret for JWT refresh token generation
- `SESSION_SECRET`: Secret for session management
- `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret
- `GITHUB_CALLBACK_URL`: The callback URL for GitHub OAuth (should be `https://your-api-url.railway.app/api/auth/github/callback`)
- `FRONTEND_URL`: The URL of your frontend application

## Troubleshooting

- **Deployment Fails**: Check the GitHub Actions logs for details
- **Database Connection Issues**: Verify your `DATABASE_URL` is correctly set in Railway
- **OAuth Errors**: Make sure your GitHub callback URL is correctly configured in both Railway and GitHub
