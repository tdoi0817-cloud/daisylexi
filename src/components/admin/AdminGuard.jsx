// src/components/admin/AdminGuard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function AdminGuard({ children, require = 'ctv' }) {
  const { user, loading } = useAuth()
  const [role, setRole]     = useState(null)
  const [checking, setCheck] = useState(true)

  // Re-fetch role trực tiếp từ Firestore mỗi lần mount
  useEffect(() => {
    if (!user) { setCheck(false); return }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        const r = snap.exists() ? (snap.data().role || 'reader') : 'reader'
        setRole(r)
      })
      .catch(() => setRole('reader'))
      .finally(() => setCheck(false))
  }, [user?.uid])

  if (loading || checking) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:32, marginBottom:8 }}>🔄</div>
      <p style={{ color:'#6b7280' }}>Checking permissions...</p>
    </div>
  )

  if (!user) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <h3 style={{ margin:'12px 0 8px', fontWeight:800 }}>Sign in required</h3>
      <p style={{ color:'#6b7280', fontSize:14 }}>Please sign in to continue.</p>
    </div>
  )

  const isAdmin = role === 'admin'
  const isCTV   = role === 'ctv' || isAdmin
  const hasAccess = require === 'admin' ? isAdmin : isCTV

  if (!hasAccess) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48 }}>🚫</div>
      <h3 style={{ margin:'12px 0 8px', fontWeight:800 }}>Access denied</h3>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:8 }}>
        {require === 'admin' ? 'This page is for Admins only.' : 'This page requires Contributor or Admin access.'}
      </p>
      <p style={{ fontSize:13, color:'#9ca3af' }}>
        Your current role: <strong style={{ color: role==='reader'?'#ef4444':'#6366f1' }}>{role || 'reader'}</strong>
        <br/>UID: <code style={{ fontSize:11 }}>{user.uid}</code>
      </p>
      <p style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>
        If this is wrong, go to Firebase Console → Firestore → users → {user.uid.slice(0,8)}... → set role = "admin"
      </p>
    </div>
  )

  return children
}
