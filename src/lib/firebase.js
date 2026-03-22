// src/lib/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// HƯỚNG DẪN:
// 1. Vào https://console.firebase.google.com
// 2. Tạo project mới → "meokammap"
// 3. Project Settings → General → Your apps → Add app (Web)
// 4. Copy firebaseConfig vào bên dưới
// 5. Tạo file .env ở root và điền các VITE_ variables
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const storage  = getStorage(app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

// Auth Providers
export const googleProvider   = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Facebook provider thêm scope lấy email
facebookProvider.addScope('email')
facebookProvider.addScope('public_profile')
