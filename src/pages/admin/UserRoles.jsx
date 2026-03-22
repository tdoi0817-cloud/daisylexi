// src/pages/admin/UserRoles.jsx — Phân quyền users (admin only)
import { useState, useEffect } from 'react'
import { getUsers, setUserRole } from '../../lib/admin'
import AdminGuard from '../../components/admin/AdminGuard'

const ROLES = [
  { value:'reader', label:'Reader',  color:'#f1f5f9', text:'#6b7280',  desc:'Chỉ đọc' },
  { value:'ctv',    label:'CTV',     color:'#dcfce7', text:'#166534',  desc:'Đăng truyện' },
  { value:'admin',  label:'Admin',   color:'#ede9fe', text:'#6d28d9',  desc:'Toàn quyền' },
]

export default function UserRoles() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)
  const [search, setSearch]   = useState('')
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    getUsers(100)
      .then(us => setUsers(us))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (uid, role) => {
    setSaving(uid)
    try {
      await setUserRole(uid, role)
      setUsers(us => us.map(u => u.id === uid ? {...u, role} : u))
      setMsg('✅ Đã cập nhật quyền!')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg('❌ Lỗi: ' + e.message)
    } finally { setSaving(null) }
  }

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleInfo = (r) => ROLES.find(x => x.value === r) || ROLES[0]

  return (
    <AdminGuard require="admin">
      <div>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800 }}>🔑 Phân quyền người dùng</h2>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>Chỉ Admin mới có quyền thay đổi role.</p>

        {/* Role legend */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
          {ROLES.map(r => (
            <div key={r.value} style={{ display:'flex', alignItems:'center', gap:8, background:r.color, padding:'8px 14px', borderRadius:10 }}>
              <span style={{ fontWeight:800, fontSize:13, color:r.text }}>{r.label}</span>
              <span style={{ fontSize:12, color:r.text, opacity:0.8 }}>— {r.desc}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Tìm theo tên hoặc email..."
          style={{ width:'100%', maxWidth:360, padding:'9px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:16, fontFamily:'inherit' }} />

        {msg && <div style={{ padding:'10px 14px', background: msg.startsWith('✅')?'#f0fdf4':'#fef2f2', color: msg.startsWith('✅')?'#16a34a':'#ef4444', borderRadius:10, fontSize:13, marginBottom:12 }}>{msg}</div>}

        {loading ? (
          <p style={{ textAlign:'center', color:'#9ca3af', padding:'40px 0' }}>Đang tải danh sách users...</p>
        ) : (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign:'center', padding:'30px', color:'#9ca3af' }}>Không tìm thấy user nào.</p>
            ) : (
              filtered.map((u, i) => {
                const ri = roleInfo(u.role)
                return (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<filtered.length-1?'1px solid #f1f5f9':'none', flexWrap:'wrap', gap:10 }}>

                    {/* Avatar */}
                    <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 }}>
                      {u.photoURL ? <img src={u.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (u.displayName?.[0] || '?')}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{u.displayName || 'Chưa đặt tên'}</div>
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{u.email}</div>
                    </div>

                    {/* Current role badge */}
                    <span style={{ fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:20, background:ri.color, color:ri.text, flexShrink:0 }}>
                      {ri.label}
                    </span>

                    {/* Role selector */}
                    <select
                      value={u.role || 'reader'}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={saving === u.id}
                      style={{ padding:'7px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontWeight:600, outline:'none', cursor:'pointer', background:'#f8fafc', opacity: saving===u.id?0.6:1 }}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                    </select>

                    {saving === u.id && <span style={{ fontSize:12, color:'#6b7280' }}>Đang lưu...</span>}
                  </div>
                )
              })
            )}
          </div>
        )}

        <div style={{ marginTop:20, padding:'14px 16px', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:12 }}>
          <p style={{ margin:0, fontSize:13, color:'#92400e' }}>
            <strong>⚠️ Lưu ý:</strong> Firestore Security Rules kiểm tra role server-side. 
            Chỉ document <code>users/{'{uid}'}.role === 'admin'</code> mới được phép gọi <code>setUserRole()</code>.
            Đảm bảo bạn đã deploy <code>firestore.rules</code> lên Firebase.
          </p>
        </div>
      </div>
    </AdminGuard>
  )
}
