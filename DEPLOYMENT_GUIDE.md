# 🚀 CodeBud Deployment Guide

## Two-Part Deployment Strategy

### Part 1: Deploy Python DSA Server

#### Option A: Railway (Recommended - Free)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** and select your repo
3. **Create New Service** → "Deploy from GitHub repo"
4. **Select Repository**: `codebud_frontend`
5. **Root Directory**: Set to `server`
6. **Deploy** - Railway auto-detects Python and uses `requirements.txt`

**Environment Variables to Set:**
```
PORT=5001
FLASK_ENV=production
```

#### Option B: Render (Free Tier)

1. **Sign up** at [render.com](https://render.com)
2. **New** → "Web Service"
3. **Connect GitHub** repo: `codebud_frontend`
4. **Settings**:
   - Name: `codebud-dsa-server`
   - Root Directory: `server`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python server.py`
   - Plan: Free

#### Option C: Heroku

```bash
# In the server directory
cd server
heroku create your-dsa-server-name
git subtree push --prefix=server heroku main
```

### Part 2: Deploy React Frontend to Netlify

1. **Update Environment Variables**
   
   Create/update `.env` in your React app root:
   ```env
   REACT_APP_DSA_SERVER_URL=https://your-server-url.railway.app/api
   ```

2. **Update CORS in Server**
   
   In `server/server.py`, update the CORS origins:
   ```python
   CORS(app, origins=[
       "http://localhost:3000",  # Development
       "https://your-netlify-app.netlify.app",  # Your Netlify URL
       "https://*.netlify.app"  # All Netlify domains
   ])
   ```

3. **Build React App**
   ```bash
   npm run build
   ```

4. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `build` folder
   - Or connect GitHub for auto-deployments

## 🔄 Full Deployment Steps

### Step 1: Deploy Server First
1. Choose Railway/Render/Heroku
2. Deploy the `/server` directory
3. Note your server URL (e.g., `https://xyz.railway.app`)

### Step 2: Update React App
1. Update `.env` with your server URL
2. Update CORS settings in `server.py` with your Netlify URL
3. Test locally: `npm start`

### Step 3: Deploy React App
1. Build: `npm run build`
2. Deploy to Netlify
3. Test the full integration

## 🌐 Example URLs After Deployment

```
Frontend: https://codebud-app.netlify.app
Backend:  https://codebud-dsa-server.railway.app
```

## 🔧 Environment Variables Reference

### React App (.env)
```env
REACT_APP_DSA_SERVER_URL=https://your-server.railway.app/api
```

### Server (Platform Settings)
```env
PORT=5001
FLASK_ENV=production
PYTHONPATH=/app
```

## 🧪 Testing Deployment

### 1. Test Server Health
```bash
curl https://your-server.railway.app/api/health
```

### 2. Test from React App
Open your Netlify app and check:
- Server status should show "🟢 Server Online"  
- You can execute code problems
- No CORS errors in browser console

## 🐛 Common Issues

### CORS Errors
- Update `server.py` with your actual Netlify URL
- Ensure both HTTP and HTTPS if needed

### Server Not Starting
- Check logs in Railway/Render dashboard
- Verify `requirements.txt` has all dependencies
- Ensure `server.py` runs locally first

### React App Can't Connect
- Check environment variable is set correctly
- Verify server URL is accessible
- Test server endpoints directly

## 💡 Pro Tips

### For Production
1. **Use Environment Variables** - Don't hardcode URLs
2. **Enable HTTPS** - Both platforms provide SSL certificates
3. **Monitor Logs** - Check server logs for errors
4. **Set up Alerts** - Get notified if server goes down

### For Development
1. Keep local development setup for testing
2. Use different environment variables for dev/prod
3. Test both local and deployed servers

---

## ✅ Summary

- ❌ **Can't deploy everything to Netlify** (Netlify = static sites only)
- ✅ **React Frontend → Netlify** (Free, easy)
- ✅ **Python Server → Railway/Render/Heroku** (Free tiers available)
- ✅ **Full integration works** once both are deployed

Your deployment will have two URLs but work seamlessly together! 🎉
