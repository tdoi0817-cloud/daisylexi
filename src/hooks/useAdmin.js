// src/hooks/useAdmin.js
import { useEffect, useState } from 'react'
import { doc, getDoc, getDocs, collection, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAdmin(user) {
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => setRole(snap.exists() ? snap.data().role || 'reader' : 'reader'))
      .catch(() => setRole('reader'))
      .finally(() => setLoading(false))
  }, [user])

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isCTV:   role === 'ctv' || role === 'admin',
  }
}

export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() })
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Gọi 1 lần từ browser console để tạo admin đầu tiên:
// import { seedFirstAdmin } from './hooks/useAdmin'
// seedFirstAdmin('UID_CUA_BAN')
export async function seedFirstAdmin(uid) {
  await setDoc(doc(db, 'users', uid), { role: 'admin' }, { merge: true })
}
