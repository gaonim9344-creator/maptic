# 🚀 Quick Start Guide

## ⚠️ Important: Before Running

### 1. Get Naver Maps Client ID (Required!)

1. Visit [Naver Cloud Platform](https://www.ncloud.com/product/applicationService/maps)
2. Create an account / Login
3. Create a new Maps application
4. Copy your **Client ID**
5. Open `client/index.html` and replace `YOUR_NAVER_CLIENT_ID`:

```html
<!-- Line 14 in client/index.html -->
<script type="text/javascript" src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=PUT_YOUR_CLIENT_ID_HERE"></script>
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install on macOS
brew install mongodb-community
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Use it in step 3

### 3. Create .env File

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/sports-discovery
JWT_SECRET=sports-discovery-super-secret-jwt-key-2024
PORT=5001
NODE_ENV=development
```

> If using MongoDB Atlas, use your connection string for MONGODB_URI

### 4. Install & Run

```bash
# You're already in the right directory!
# Dependencies are already installed ✅

# Run both client and server
npm run dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🎯 Test the App

1. **Sign Up**: Create an account at http://localhost:3000/signup
2. **Select Sports**: Choose your favorite sports (search works!)
3. **View Map**: See nearby facilities with emoji markers
4. **Search**: Use the search bar for specific facilities
5. **Profile**: Reconfigure your sports anytime

## 📁 Project Structure

```
sports-discovery/
├── server/          ← Backend (Node.js + MongoDB)
├── client/          ← Frontend (React + Vite)
├── Dockerfile       ← For Cloudtype deployment
└── README.md        ← Full documentation
```

## 🔧 Troubleshooting

**Map not loading?**
- Check if you added your Naver Maps Client ID in `client/index.html`

**Database error?**
- Make sure MongoDB is running
- Check `.env` file is created with correct MONGODB_URI

**Port already in use?**
- Stop other services on port 3000 or 5000
- Or change ports in `.env` and `client/vite.config.js`

## 📚 Full Documentation

See [walkthrough.md](file:///Users/kangeunkyung/.gemini/antigravity/brain/63ed154e-2fdb-49dc-bde0-690aa43047b6/walkthrough.md) for complete details on:
- Architecture
- All features
- Testing guide
- Cloudtype deployment
- And more!

## ✅ What's Working

- ✅ 100 sports list
- ✅ Search functionality
- ✅ Authentication (signup/signin)
- ✅ Naver Maps with geolocation
- ✅ Emoji markers for facilities
- ✅ Profile management
- ✅ Guest mode
- ✅ Premium glassmorphic design
- ✅ Mobile responsive
- ✅ Cloudtype deployment ready

---

**Need help?** Check the [README.md](file:///Users/kangeunkyung/Desktop/kadet/sports-discovery/README.md) or [walkthrough.md](file:///Users/kangeunkyung/.gemini/antigravity/brain/63ed154e-2fdb-49dc-bde0-690aa43047b6/walkthrough.md)
