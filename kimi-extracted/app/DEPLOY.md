# Deploy to Render

## Step 1: Push to GitHub

1. Go to [github.com](https://github.com) and create a **new private repository** (e.g. `bc-ai-social-tool`)
2. Do NOT add a README or .gitignore — keep it empty
3. Copy the repo URL (e.g. `https://github.com/YOURNAME/bc-ai-social-tool.git`)

## Step 2: Upload your code

Open a terminal in your project folder and run:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Connect to your GitHub repo
git remote add origin https://github.com/YOURNAME/bc-ai-social-tool.git

# Push
git branch -M main
git push -u origin main
```

> **Important:** The `.gitignore` already excludes `node_modules`, `dist`, `.env`, and other files that should not be committed.

## Step 3: Create a Render Account

1. Go to [render.com](https://render.com) and sign up (you can use GitHub login)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the repo you just pushed

## Step 4: Render Settings

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `bc-ai-social-tool` (or whatever you want) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (or paid if you need more uptime) |

## Step 5: Add Environment Variables

In the Render dashboard, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `mysql://Za2eBcCFHrZYwcU.root:74VBgLcfPqgUBEoccvMluFIgn72sUIj6@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19df0850-5e52-8420-8000-098ab2b61baa` |
| `APP_ID` | `19df0856-c4f2-8510-8000-0000b97afa14` |
| `APP_SECRET` | `4hQ0T1VwbgkK9NCRZfpEMnyTb3jY88wr` |
| `NODE_ENV` | `production` |

> **Note:** These environment variables are already set in your `.env` file. Copy them exactly into Render's Environment section.

## Step 6: Deploy

Click **"Create Web Service"**. Render will:
1. Install dependencies
2. Run `npm run build` (creates the `dist/` folder)
3. Start the server with `npm start`

Wait for the build to finish. Once you see **"Your service is live"**, click the URL.

## Custom Domain (optional)

1. In Render dashboard, go to your service → **Settings** → **Custom Domains**
2. Add your domain (e.g. `www.bcaibusiness.com`)
3. Follow Render's DNS instructions (add a CNAME record in your domain provider)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check that `node --version` is 18+ in Render settings |
| "Database error" | Double-check `DATABASE_URL` is copied correctly |
| Images not showing | Make sure `public/samples/` folder exists in your repo |
| Chat not working | Database table may need re-creation — contact me |

## Your App Features

- **Landing page** with email signup, portfolio showcase, and service pricing
- **Free AI tools**: Facebook Ads Targeting Generator, Caption Generator
- **Chat system**: Users can message you and order services (₱499/₱999/₱1,499)
- **Admin panel**: View leads, activity, chat conversations at `/admin`
- **Admin login**: `conpascual5@gmail.com` / `admin123`
