# Deployment Guide

## Vercel Deployment

### Prerequisites
- A Vercel account
- A GitHub repository with your code

### Environment Variables
Set the following environment variables in the Vercel dashboard:

1. `AUTH_SECRET` - A secure random string (at least 32 characters)
2. `POSTGRES_URL` - Your PostgreSQL connection string
3. `OPENAI_API_KEY` - Your OpenAI API key
4. `FIREWORKS_API_KEY` - Your Fireworks API key (if using)

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the project

### Troubleshooting

#### Lock File Issues
If you encounter issues with the lock file during deployment, the project includes a `vercel.json` configuration that should bypass these checks by using `--no-frozen-lockfile`.

#### Database Migration
The database migration will run automatically during the build process via the `postinstall` script.

#### React and Next.js Versions
This project uses:
- React 18.2.0
- Next.js 14.2.5

These versions are stable and compatible with each other. If you need to update them, make sure to regenerate the lock file.

### Local Development After Deployment

If you need to work on the project locally after deployment:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your local environment variables in `.env.local`
4. Run the development server:
   ```
   npm run dev
   ``` 