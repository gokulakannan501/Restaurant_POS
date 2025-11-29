# Free Deployment Guide - NO PAYMENT INFO REQUIRED

## 🚀 Deploy Backend to Render (Manual - Free Tier)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `restaurant-pos-db`
   - **Database**: `restaurant_pos`
   - **User**: `restaurant_user`
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **Create Database**
5. Wait for it to be created, then go to the database page
6. **Copy the Internal Database URL** (starts with `postgresql://`)

### Step 2: Create Backend Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `gokulakannan501/Restaurant_POS`
3. Fill in:
   - **Name**: `restaurant-pos-backend`
   - **Region**: Same as database
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**
4. Click **Advanced** and add environment variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Paste the Internal Database URL from Step 1
   - `JWT_SECRET` = Any random string (e.g., `your-super-secret-jwt-key-12345`)
   - `CORS_ORIGIN` = `*` (we'll update this later)
5. Click **Create Web Service**
6. Wait for deployment to complete
7. **Copy the Backend URL** (e.g., `https://restaurant-pos-backend.onrender.com`)

---

## 🌐 Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your repository: `gokulakannan501/Restaurant_POS`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Backend URL from Render (e.g., `https://restaurant-pos-backend.onrender.com`)
6. Click **Deploy**
7. Wait for deployment
8. **Copy the Frontend URL** (e.g., `https://restaurant-pos.vercel.app`)

### Step 2: Update CORS

1. Go back to **Render** → Your Backend Service
2. Go to **Environment** tab
3. Update `CORS_ORIGIN` from `*` to your Vercel URL
4. Click **Save Changes** (this will trigger a redeploy)

---

## 🎉 You're Done!

Your application is now deployed:
- **Frontend**: Vercel (Fast, no cold starts)
- **Backend**: Render (Free PostgreSQL + API)
- **Total Cost**: $0

### ⚠️ Important Notes

1. **Render Free Tier**: Backend sleeps after 15 minutes of inactivity. First request after sleep takes 30-60 seconds.
2. **Database**: PostgreSQL free tier expires after 90 days. You'll need to create a new one.
3. **Images**: Uploaded images will be lost on Render restarts. Consider using Cloudinary for production.

---

## 🔧 Alternative: Deploy Everything to Vercel (Serverless)

If you want to avoid Render entirely, you can deploy both frontend and backend to Vercel using serverless functions. However, this requires code restructuring. Let me know if you want this option.

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check logs in Render dashboard
- Ensure `DATABASE_URL` is correct
- Verify `prisma generate` ran during build

**Frontend can't connect to backend:**
- Check `VITE_API_URL` in Vercel environment variables
- Verify CORS_ORIGIN is set correctly in backend
- Check browser console for errors

**Database connection errors:**
- Ensure you're using the **Internal Database URL** (not External)
- Check that backend and database are in the same region
