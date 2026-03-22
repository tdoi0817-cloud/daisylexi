// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, facebookProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Lấy thêm data từ Firestore (coins, role, ...)
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const extra = snap.exists() ? snap.data() : {}
        setUser({ ...firebaseUser, coins: extra.coins ?? 0, role: extra.role ?? 'reader' })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // ── Tạo/cập nhật user document trong Firestore ──
  const ensureUserDoc = async (firebaseUser, extra = {}) => {
    const ref  = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:         firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Độc giả',
        email:       firebaseUser.email || '',
        photoURL:    firebaseUser.photoURL || '',
        coins:       10,          // tặng 10 xu khi đăng ký lần đầu
        role:        'reader',
        createdAt:   serverTimestamp(),
        ...extra,
      })
    }
  }

  // ── Google ──
  const loginGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    await ensureUserDoc(result.user)
    return result.user
  }

  // ── Facebook ──
  const loginFacebook = async () => {
    const result = await signInWithPopup(auth, facebookProvider)
    await ensureUserDoc(result.user)
    return result.user
  }

  // ── Email / Password ──
  const loginEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  const registerEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    await ensureUserDoc(result.user)
    return result.user
  }

  const logout = () => signOut(auth)

  // ── Cập nhật xu ──
  const updateCoins = async (delta) => {
    if (!user) return
    const ref     = doc(db, 'users', user.uid)
    const snap    = await getDoc(ref)
    const current = snap.exists() ? (snap.data().coins ?? 0) : 0
    const next    = Math.max(0, current + delta)
    await setDoc(ref, { coins: next }, { merge: true })
    setUser(prev => ({ ...prev, coins: next }))
    return next
  }

  return { user, loading, loginGoogle, loginFacebook, loginEmail, registerEmail, logout, updateCoins }
}
