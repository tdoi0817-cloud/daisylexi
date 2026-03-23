// src/pages/admin/AdminLayout.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../../lib/firebase'

const MENU_CTV = [
  { path:'/admin',              label:'📊 Overview',         exact:true },
  { path:'/admin/stories',      label:'📚 Manage Stories'              },
  { path:'/admin/ai-generate',  label:'🤖 AI Generate'                 },
  { path:'/admin/bulk-upload',  label:'📤 Bulk Upload'                 },
]
const MENU_ADMIN = [
  { path:'/admin/users',        label:'👥 Manage Users'                },
  { path:'/admin/roles',        label:'🔑 Roles'                       },
  { path:'/admin/seo',          label:'🔍 SEO Manager'                 },
]

export default function AdminLayout() {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)
  const loc      = useLocation()
  const navigate = useNavigate()

  // Listen to auth + fetch role fresh from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        setUser(null); setRole(null); setLoading(false)
        return
      }
      setUser(firebaseUser)
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const r = snap.exists() ? (snap.data().role || 'reader') : 'reader'
        setRole(r)
      } catch(e) {
        setRole('reader')
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = role === 'admin'
  const isCTV   = role === 'ctv' || isAdmin
  const menu    = isAdmin ? [...MENU_CTV, ...MENU_ADMIN] : MENU_CTV

  const isActive = (path, exact) =>
    exact ? loc.pathname === path : loc.pathname.startsWith(path)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>🔄</div>
        <p style={{ color:'#6b7280', fontSize:14 }}>Loading...</p>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
      <h3 style={{ margin:'0 0 8px', fontWeight:800 }}>Sign in required</h3>
      <p style={{ color:'#6b7280', fontSize:14 }}>Please sign in to access the dashboard.</p>
    </div>
  )

  if (!isCTV) return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🚫</div>
      <h3 style={{ margin:'0 0 8px', fontWeight:800 }}>Access denied</h3>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:6 }}>
        Your role: <strong style={{ color:'#ef4444' }}>{role}</strong>
      </p>
      <p style={{ color:'#9ca3af', fontSize:12 }}>
        UID: <code>{user.uid}</code>
      </p>
      <p style={{ color:'#9ca3af', fontSize:12, marginTop:6 }}>
        Go to Firebase Console → Firestore → users → {user.uid} → set role = "admin"
      </p>
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 110px)', gap:0 }}>
      {/* Sidebar */}
      <aside style={{ width:210, flexShrink:0, background:'#fff', borderRight:'1px solid #e8eaf0', padding:'20px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px 18px', borderBottom:'1px solid #f1f5f9', marginBottom:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:isAdmin?'#6366f1':'#10b981', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:800, flexShrink:0 }}>
            {isAdmin ? '👑' : '✍️'}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.displayName || user.email?.split('@')[0] || 'Admin'}
            </div>
            <span style={{ fontSize:10, fontWeight:700, padding:'1px 8px', borderRadius:10, background:isAdmin?'#ede9fe':'#dcfce7', color:isAdmin?'#6d28d9':'#166534' }}>
              {isAdmin ? 'ADMIN' : 'CTV'}
            </span>
          </div>
        </div>

        <nav>
          {menu.map(item => (
            <Link key={item.path} to={item.path}
              style={{ display:'block', padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight:600, textDecoration:'none', marginBottom:2, transition:'all 0.15s',
                background: isActive(item.path, item.exact) ? '#ede9fe' : 'transparent',
                color:      isActive(item.path, item.exact) ? '#6d28d9' : '#374151' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
          <Link to="/" style={{ display:'block', padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight:600, color:'#6b7280', textDecoration:'none' }}>
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'20px', minWidth:0, overflowX:'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
