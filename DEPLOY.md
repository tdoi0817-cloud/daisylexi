# 🐱 Mèo Kam Mập — Hướng dẫn Deploy

## Tổng quan

```
GitHub repo
    ├── Netlify  (hosting chính, CDN toàn cầu, HTTPS tự động)
    └── Firebase (Auth + Firestore DB + Storage)
```

---

## BƯỚC 1 — Chuẩn bị Firebase

### 1.1 Tạo Firebase Project
1. Vào https://console.firebase.google.com
2. Click **"Add project"** → đặt tên **meokammap**
3. Bật Google Analytics nếu muốn

### 1.2 Bật Authentication
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** → bật:
   - ✅ **Google** (bật ngay, không cần config thêm)
   - ✅ **Facebook** (cần App ID & App Secret — xem bước 1.3)
   - ✅ **Email/Password**

### 1.3 Cài đặt Facebook Login
1. Vào https://developers.facebook.com → **My Apps** → **Create App**
2. Chọn **Consumer** → điền tên app
3. Thêm product **Facebook Login**
4. **Settings > Basic**: copy **App ID** và **App Secret**
5. Paste vào Firebase → Authentication → Facebook
6. Copy **OAuth redirect URI** từ Firebase → dán vào Facebook App:
   - Facebook App → Facebook Login → Settings → Valid OAuth Redirect URIs

### 1.4 Tạo Firestore Database
1. Firebase Console → **Firestore Database** → **Create database**
2. Chọn **Production mode**
3. Chọn region: **asia-southeast1** (Singapore, gần VN nhất)

### 1.5 Tạo Storage
1. Firebase Console → **Storage** → **Get started**
2. Chọn **Production mode** → region **asia-southeast1**

### 1.6 Lấy Firebase Config
1. Firebase Console → **Project Settings** (⚙️)
2. Scroll xuống **Your apps** → **Add app** → chọn **Web** (</>)
3. Đặt nickname: **meokammap-web**
4. Copy object `firebaseConfig`

---

## BƯỚC 2 — Chuẩn bị code local

```bash
# Clone / download project về máy
git clone <your-repo-url>
cd manga-app

# Cài dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
```

Mở `.env` và điền các giá trị từ Firebase config:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=meokammap.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=meokammap
VITE_FIREBASE_STORAGE_BUCKET=meokammap.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

Test local:
```bash
npm run dev
# Mở http://localhost:5173
```

---

## BƯỚC 3 — Deploy Firestore Rules & Indexes

```bash
# Cài Firebase CLI (1 lần duy nhất)
npm install -g firebase-tools

# Đăng nhập
firebase login

# Liên kết project
firebase use --add
# Chọn project "meokammap" → alias: default

# Deploy rules và indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## BƯỚC 4 — Push lên GitHub

```bash
git init
git add .
git commit -m "feat: initial manga platform"

# Tạo repo trên github.com rồi:
git remote add origin https://github.com/YOUR_USERNAME/meokammap.git
git push -u origin main
```

---

## BƯỚC 5 — Deploy lên Netlify

### 5.1 Kết nối GitHub
1. Vào https://app.netlify.com → **Add new site** → **Import an existing project**
2. Chọn **GitHub** → authorize → chọn repo **meokammap**

### 5.2 Cấu hình Build
Netlify tự đọc `netlify.toml` — bạn chỉ cần điền:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 5.3 Thêm Environment Variables (QUAN TRỌNG)
Netlify → Site settings → **Environment variables** → Add:

```
VITE_FIREBASE_API_KEY          = AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN      = meokammap.firebaseapp.com
VITE_FIREBASE_PROJECT_ID       = meokammap
VITE_FIREBASE_STORAGE_BUCKET   = meokammap.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID           = 1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID   = G-XXXXXXX
```

### 5.4 Deploy
Click **Deploy site** → Netlify build và deploy (~2-3 phút)

Bạn nhận được URL dạng: `https://meokammap-abc123.netlify.app`

---

## BƯỚC 6 — Gắn domain meokammap.com

### Trên Netlify:
1. **Site settings** → **Domain management** → **Add custom domain**
2. Nhập `meokammap.com` → **Verify**
3. Netlify hiện DNS records cần thêm

### Trên nhà cung cấp domain:
Thêm 2 records sau vào DNS:
```
Type  Name    Value
A     @       75.2.60.5
CNAME www     meokammap-abc123.netlify.app
```

HTTPS tự động được cấp bởi Let's Encrypt (~10 phút sau khi DNS propagate).

---

## BƯỚC 7 — Thêm Authorized Domains vào Firebase

Firebase Console → Authentication → **Settings** → **Authorized domains** → Add:
- `meokammap.com`
- `www.meokammap.com`
- `meokammap-abc123.netlify.app`

---

## BƯỚC 8 — Google AdSense

1. Đăng ký tại https://adsense.google.com
2. Thêm site `meokammap.com`
3. Đặt script verify vào `index.html` (AdSense sẽ cung cấp)
4. Sau khi được duyệt (~1-14 ngày), thay `ca-pub-XXXX` trong `index.html` bằng ID thật
5. Thêm ad units vào các vị trí trong code

---

## BƯỚC 9 — Shopee Affiliate

1. Đăng ký: https://affiliate.shopee.vn
2. Sau khi được duyệt, vào **Tools** → **Product Link** để tạo link affiliate
3. Thay các `#shopee-aff` link trong code bằng link thật

---

## Auto-deploy (CI/CD)

Mỗi khi bạn `git push`:
```bash
git add .
git commit -m "update: thêm chapter mới"
git push
# → Netlify tự động build & deploy trong ~2 phút
```

---

## Cấu trúc thư mục

```
meokammap/
├── index.html              # Entry + AdSense + Facebook SDK
├── netlify.toml            # Netlify config
├── firebase.json           # Firebase hosting config
├── firestore.rules         # Bảo mật Firestore
├── firestore.indexes.json  # Indexes cho query
├── storage.rules           # Bảo mật Storage
├── .env.example            # Template biến môi trường
├── .env                    # ← KHÔNG commit lên git!
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   ├── firebase.js     # Firebase init
    │   └── firestore.js    # DB operations
    ├── hooks/
    │   └── useAuth.js      # Auth hook (FB + Google + Email)
    ├── components/
    │   ├── Header.jsx
    │   ├── AuthModal.jsx
    │   ├── CoinModal.jsx
    │   ├── CommentSection.jsx
    │   ├── ShareModal.jsx
    │   ├── AdBanner.jsx
    │   └── ShopeeWidget.jsx
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── StoryPage.jsx
    │   └── ChapterPage.jsx
    └── styles/
        └── global.css
```

---

## Chi phí ước tính

| Dịch vụ | Free tier | Khi lớn hơn |
|---------|-----------|-------------|
| Netlify | 100GB bandwidth/tháng | $19/tháng |
| Firebase Firestore | 1GB + 50K reads/ngày | ~$0.06/100K reads |
| Firebase Storage | 5GB | $0.026/GB |
| Firebase Auth | Miễn phí | Miễn phí |
| Domain .com | ~300K₫/năm | — |

**→ Hoàn toàn miễn phí khi mới bắt đầu!**
