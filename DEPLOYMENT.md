# 🚀 Deployment Guide - Gnōseōn

**Status**: ✅ Ready for Replit & Render Deployment

## 🌀 Replit Deployment (Recommended for Dev/Fast Preview)

1. **Import ke Replit**: Hubungkan akun GitHub Anda ke Replit dan import repositori `Gnoseon-Apps`.
2. **Konfigurasi Environment**: Replit akan mendeteksi file `.replit`. Pastikan Secrets (Environment Variables) berikut diisi jika diperlukan:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
3. **Persistence**: SQLite secara otomatis tersimpan di dalam project folder Replit. Data akan tetap ada (persistent) selama file `.db` tidak dihapus manual.
4. **Run**: Klik tombol "Run" besar di bagian atas. Replit akan menjalankan `npm install`, `npm run build`, dan memulai server backend.

---

## 📋 Quick Summary

Aplikasi ini sudah dikonfigurasi untuk di-deploy ke **Render.com (Free Tier)** dengan:
- ✅ Frontend static hosting
- ✅ Backend Node.js service
- ✅ SQLite database dengan persistent storage
- ✅ Core Messaging functionality (P2P & Group)
- ✅ Health checks & monitoring
- ✅ CORS configured untuk Render

---

## 🎯 How to Deploy (5 Steps)

### Step 1: Push ke GitHub
```bash
git add .
git commit -m "Prepare for Render deployment: disable bot AI, configure CORS"
git push origin main
```

### Step 2: Create Render Account
- Buka https://render.com
- Sign up dengan GitHub
- Authorize repository

### Step 3: Create Blueprint from render.yaml
1. Di Render dashboard, klik "New" → "Blueprint"
2. Connect your repository
3. Pilih branch: `main`
4. Klik "Create from Blueprint"

### Step 4: Wait for Deploy
- Build frontend (~3-5 min)
- Build backend (~2-3 min)
- Total: ~5-10 minutes
- Watch logs untuk progress

### Step 5: Verify Deployment
```bash
# Test health endpoint
curl https://gnoseon-backend.onrender.com/api/health

# Open frontend
https://gnoseon-frontend.onrender.com
```

---

## 🌐 Akses Aplikasi Setelah Deploy

| Service | URL |
|---------|-----|
| **Frontend** | `https://gnoseon-frontend.onrender.com` |
| **Backend API** | `https://gnoseon-backend.onrender.com/api` |
| **Health Check** | `https://gnoseon-backend.onrender.com/api/health` |
| **Metrics** | `https://gnoseon-backend.onrender.com/api/metrics` |

---

## 🔧 Apa yang Sudah Dikonfigurasi

### Environment & CORS
- ✅ Dynamic CORS menggunakan `FRONTEND_URL` env variable
- ✅ Development & production environments terpisah
- ✅ Logging optimized untuk production

### Database
- ✅ SQLite dengan persistent 1 GB disk
- ✅ Auto-creates pada first run
- ✅ Data persists antar deployments

### Bot AI
- ✅ Disabled di production (mock response)
- ✅ Siap untuk development (bisa connect ke LM Studio lokal)
- ✅ Graceful fallback jika LM Studio unavailable

### Security
- ✅ HTTPS enabled
- ✅ Rate limiting (100 req/15 min)
- ✅ CORS properly configured
- ✅ Password hashing (bcryptjs)

---

## 📝 Environment Variables (Backend)

Render akan otomatis set ini dari `render.yaml`:
```
NODE_ENV=production
PORT=3001
DB_NAME=gnoseon-server.db
DB_PATH=/opt/render/project/src/data
FRONTEND_URL=https://gnoseon-frontend.onrender.com
```

---

## 🚨 Important Notes

### No Custom Domain Required
- Aplikasi berfungsi penuh dengan Render subdomain
- `*.onrender.com` adalah free tier default

### Free Tier Limitations
- Backend auto-spins down setelah 15 min inactivity (cold start)
- Storage 1 GB (cukup untuk most use cases)
- Shared resources
- Deployment menggunakan GitHub for free

### First Request Delay
- Setelah inactivity, first request akan butuh 5-30 detik (cold start)
- Selanjutnya normal speed

---

## 📊 Monitoring Dashboard

### Health Check
```bash
curl https://gnoseon-backend.onrender.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-21T...",
  "uptime": 12345,
  "environment": "production"
}
```

### Metrics
```bash
curl https://gnoseon-backend.onrender.com/api/metrics
```

---

## 🐛 Troubleshooting

| Issue | Solusi |
|-------|--------|
| Build fails | Check Render logs, verify `npm run build` locally works |
| CORS error | Verify `FRONTEND_URL` environment variable set correctly |
| Database error | Check disk is mounted at `/opt/render/project/src/data` |
| Bot not working | Expected - bot AI disabled in production (mock response) |
| Cold start slow | Normal - first request takes 5-30s after inactivity |

---

## 🔄 Post-Deployment Testing

1. **Access aplikasi**
   ```
   https://gnoseon-frontend.onrender.com
   ```

2. **Create account & login**
   - Username: test1
   - Password: password123

3. **Test core features**
   - ✅ Send message
   - ✅ Upload file
   - ✅ Create group
   - ✅ Bot AI (akan respond dengan mock message)

4. **Check backend health**
   ```bash
   curl https://gnoseon-backend.onrender.com/api/health
   ```

---

## 📈 Scaling Later (Optional)

Jika ingin upgrade:
1. **Paid Tier Render**: Dedicated resources, always-on
2. **Custom Domain**: Add domain di Render settings
3. **LM Studio**: Setup server terpisah untuk enable bot AI

---

## 🆘 Lebih Lanjut

- **Render Docs**: https://render.com/docs
- **Troubleshooting**: Check logs di Render dashboard
- **Repository**: All config files sudah include

---

**Status**: ✅ READY TO DEPLOY
**Platform**: Render.com (Free Tier)
**Updated**: 2026-05-21
