# Deployment Guide - Free Tier Options

## Option 1: Vercel (Frontend) + Render (Backend) - NO PAYMENT INFO REQUIRED

This is the recommended approach if you want to avoid adding payment information.

### Backend Deployment (Render)

1. **Push your code** to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New +** → **Blueprint**
4. Connect your repository
5. Render will detect `render.yaml` and create:
   - PostgreSQL Database (Free tier)
   - Backend API Service (Free tier)
6. After deployment, copy the **Backend URL** (e.g., `https://restaurant-pos-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Backend URL from Render (e.g., `https://restaurant-pos-backend.onrender.com`)
6. Click **Deploy**
7. After deployment, copy the **Frontend URL** (e.g., `https://restaurant-pos.vercel.app`)

### Final Configuration

1. Go back to **Render Dashboard** → Your Backend Service → **Environment**
2. Update `CORS_ORIGIN` with your Vercel frontend URL
3. Click **Save Changes** (this will trigger a redeploy)

---

## Option 2: Railway.app - NO PAYMENT INFO REQUIRED

Railway offers $5 free credit per month without requiring payment info.

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Railway will detect both frontend and backend
6. Add environment variables as needed

---

## Option 3: Netlify (Frontend) + Railway (Backend)

Similar to Option 1 but using Netlify instead of Vercel.

---

## Free Tier Limitations

**Render Free Tier:**
- Backend sleeps after 15 minutes of inactivity
- Cold starts take 30-60 seconds
- 750 hours/month (enough for one service running 24/7)

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- No sleep/cold starts

**Railway Free Tier:**
- $5 credit/month
- No sleep for services
- Pay-as-you-go after credit exhausted

---

## Recommended: Option 1 (Vercel + Render)

This gives you:
- ✅ No payment info required
- ✅ Generous free tiers
- ✅ Easy deployment
- ✅ Good performance for small projects
