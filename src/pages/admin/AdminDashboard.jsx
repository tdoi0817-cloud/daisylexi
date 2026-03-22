// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { getAllStories } from '../../lib/adminFirestore'
import { getAllUsers } from '../../hooks/useAdmin'

export default function AdminDashboard({ user }) {
  const [stories, setStories] = useState([])
  const [users, setUsers]     = useState([])

  useEffect(() => {
    getAllStories().then(setStories).catch(()=>{})
    getAllUsers().then(setUsers).catch(()=>{})
  }, [])

  const stats = [
    { label:'Tổng truyện',   value: stories.length,                             icon:'📚', color:'#6366f1', bg:'#ede9fe' },
    { label:'Thành viên',    value: users.length,                               icon:'👥', color:'#0ea5e9', bg:'#e0f2fe' },
    { label:'CTV',           value: users.filter(u=>u.role==='ctv').length,     icon:'✍️', color:'#f59e0b', bg:'#fef3c7' },
    { label:'Tổng lượt xem', value: stories.reduce((a,s)=>a+(s.views||0),0).toLocaleString('vi-VN'), icon:'👁', color:'#10b981', bg:'#d1fae5' },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:800, color:'#1e293b' }}>📊 Tổng quan</h2>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:16 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent stories */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9', fontWeight:800, fontSize:14 }}>📋 Truyện gần đây</div>
        {stories.slice(0,6).map((s,i) => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:i<5?'1px solid #f8fafc':'none' }}>
            <img src={s.coverUrl||`https://picsum.photos/seed/${s.id}/60/80`} alt="" style={{ width:36, height:50, borderRadius:6, objectFit:'cover', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</div>
              <div style={{ fontSize:11, color:'#9ca3af' }}>👥 {s.team} · 👁 {(s.views||0).toLocaleString()}</div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8, background: s.status==='Hoàn thành'?'#d1fae5':'#ede9fe', color: s.status==='Hoàn thành'?'#065f46':'#5b21b6' }}>
              {s.status||'Đang TH'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
