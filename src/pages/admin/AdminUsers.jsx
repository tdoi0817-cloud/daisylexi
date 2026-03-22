// src/pages/admin/AdminUsers.jsx — Phân quyền user (admin only)
import { useState, useEffect } from 'react'
import ProtectedAdmin from '../../components/admin/ProtectedAdmin'
import { getAllUsers, setUserRole } from '../../hooks/useAdmin'

const ROLES = [
  { value:'reader', label:'👤 Độc giả',      color:'#6b7280', bg:'#f1f5f9' },
  { value:'ctv',    label:'✍️ Cộng Tác Viên', color:'#f59e0b', bg:'#fef3c7' },
  { value:'admin',  label:'⚡ Admin',          color:'#6366f1', bg:'#ede9fe' },
]

export default function AdminUsers({ user }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState({})

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const changeRole = async (uid, role) => {
    setSaving(p => ({...p, [uid]: true}))
    try {
      await setUserRole(uid, role)
      setUsers(prev => prev.map(u => u.id===uid ? {...u, role} : u))
    } finally { setSaving(p => ({...p, [uid]: false})) }
  }

  const filtered = users.filter(u =>
    (u.displayName||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ProtectedAdmin user={user} requireAdmin>
      <div>
        <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:800, color:'#1e293b' }}>👥 Phân quyền thành viên</h2>

        {/* Role legend */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {ROLES.map(r => (
            <div key={r.value} style={{ display:'flex', alignItems:'center', gap:6, background:r.bg, borderRadius:10, padding:'6px 14px' }}>
              <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.label}</span>
            </div>
          ))}
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm theo tên hoặc email..."
          style={{ width:'100%', padding:'9px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', marginBottom:14, boxSizing:'border-box', background:'#fff' }} />

        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 150px', gap:12, padding:'10px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>
            <span>Thành viên</span>
            <span>Email</span>
            <span>Quyền hạn</span>
          </div>

          {loading && <div style={{ padding:24, textAlign:'center', color:'#9ca3af' }}>Đang tải...</div>}

          {filtered.map((u, i) => {
            const roleInfo = ROLES.find(r=>r.value===u.role) || ROLES[0]
            const isSelf   = u.id === user?.uid
            return (
              <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 180px 150px', gap:12, padding:'12px 16px', borderBottom:i<filtered.length-1?'1px solid #f8fafc':'none', alignItems:'center' }}>
                {/* User info */}
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700 }}>
                    {u.photoURL ? <img src={u.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (u.displayName?.[0]||'?')}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.displayName || 'Chưa đặt tên'}
                      {isSelf && <span style={{ fontSize:10, color:'#6366f1', marginLeft:6, background:'#ede9fe', padding:'1px 6px', borderRadius:8 }}>Bạn</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>
                      🪙 {u.coins||0} xu · {u.createdAt ? new Date(u.createdAt.toDate?.()??u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email||'—'}</div>

                {/* Role selector */}
                <div>
                  {isSelf ? (
                    <span style={{ fontSize:12, fontWeight:700, color:roleInfo.color, background:roleInfo.bg, padding:'4px 12px', borderRadius:20 }}>{roleInfo.label}</span>
                  ) : (
                    <select value={u.role||'reader'} onChange={e=>changeRole(u.id, e.target.value)} disabled={saving[u.id]}
                      style={{ padding:'5px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', outline:'none', background: roleInfo.bg, color: roleInfo.color, opacity: saving[u.id]?0.6:1 }}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )
          })}

          {!loading && filtered.length===0 && (
            <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Không tìm thấy thành viên nào.</div>
          )}
        </div>

        <div style={{ marginTop:16, background:'#fffbeb', borderRadius:10, border:'1px solid #fde68a', padding:'12px 16px', fontSize:12, color:'#92400e' }}>
          <strong>💡 Hướng dẫn cấp quyền lần đầu:</strong> Để tạo admin đầu tiên, mở browser console trên trang web và chạy:<br/>
          <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, marginTop:4, display:'inline-block', fontSize:11 }}>
            {"import('/src/hooks/useAdmin.js').then(m => m.seedFirstAdmin('UID_CUA_BAN'))"}
          </code><br/>
          Hoặc vào Firebase Console → Firestore → users → [uid] → sửa field <code>role</code> thành <code>"admin"</code>
        </div>
      </div>
    </ProtectedAdmin>
  )
}
