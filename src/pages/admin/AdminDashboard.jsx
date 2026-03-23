// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function AdminDashboard() {
  const [stories, setStories] = useState([])
  const [users,   setUsers]   = useState([])

  useEffect(() => {
    getDocs(query(collection(db,'stories'), orderBy('createdAt','desc'), limit(50))).then(s=>setStories(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{})
    getDocs(query(collection(db,'users'), orderBy('createdAt','desc'), limit(100))).then(s=>setUsers(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{})
  }, [])

  const stats = [
    { label:'Total Stories', value:stories.length,                            icon:'📚', color:'#6366f1', bg:'#ede9fe', to:'/admin/stories' },
    { label:'Total Members', value:users.length,                              icon:'👥', color:'#0ea5e9', bg:'#e0f2fe', to:'/admin/users' },
    { label:'Contributors',  value:users.filter(u=>u.role==='ctv').length,   icon:'✍️', color:'#f59e0b', bg:'#fef3c7', to:'/admin/users' },
    { label:'Total Views',   value:stories.reduce((a,s)=>a+(s.views||0),0).toLocaleString(), icon:'👁', color:'#10b981', bg:'#d1fae5', to:'/admin/stories' },
  ]

  const QUICK_ACTIONS = [
    { to:'/admin/stories/new',   label:'📝 New Story',         desc:'Add story manually' },
    { to:'/admin/ai-generate',   label:'🤖 AI Generate',       desc:'Auto-create 10 stories' },
    { to:'/admin/cms',           label:'🗂 CMS',               desc:'Pages, posts, notifications' },
    { to:'/admin/users',         label:'👥 User Management',   desc:'Roles, approvals, add user' },
    { to:'/admin/ctv-payments',  label:'💸 CTV Payments',      desc:'Approve CTVs & pay earnings' },
    { to:'/admin/affiliate',     label:'🛍️ Affiliate',         desc:'Amazon & Etsy links' },
    { to:'/admin/seo',           label:'🔍 SEO Manager',       desc:'Sitemap & meta tags' },
    { to:'/admin/bulk-upload',   label:'📤 Bulk Upload',       desc:'Upload chapter images' },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:800 }}>📊 Dashboard</h2>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.to} style={{ textDecoration:'none', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:16, display:'block', transition:'transform 0.15s, box-shadow 0.15s' }}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}}
            onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
            <div style={{ width:36,height:36,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:'#6b7280',marginTop:2,fontWeight:600 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',overflow:'hidden',marginBottom:20 }}>
        <div style={{ padding:'14px 16px',borderBottom:'1px solid #f1f5f9',fontWeight:800,fontSize:14 }}>⚡ Quick Actions</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:0 }}>
          {QUICK_ACTIONS.map((a,i) => (
            <Link key={a.to} to={a.to}
              style={{ textDecoration:'none',padding:'14px 16px',borderRight:i%2===0?'1px solid #f1f5f9':'none',borderBottom:'1px solid #f1f5f9',display:'block',transition:'background 0.15s' }}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontWeight:700,fontSize:13,color:'#1e293b',marginBottom:3 }}>{a.label}</div>
              <div style={{ fontSize:11,color:'#9ca3af' }}>{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent stories */}
      <div style={{ background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',overflow:'hidden' }}>
        <div style={{ padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontWeight:800,fontSize:14 }}>📋 Recent Stories</span>
          <Link to="/admin/stories" style={{ fontSize:12,color:'#6366f1',fontWeight:600,textDecoration:'none' }}>View all →</Link>
        </div>
        {stories.length===0
          ? <div style={{ textAlign:'center',padding:'24px',color:'#9ca3af',fontSize:13 }}>No stories yet. <Link to="/admin/ai-generate" style={{ color:'#6366f1' }}>Generate with AI →</Link></div>
          : stories.slice(0,6).map((s,i) => (
            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:i<5?'1px solid #f8fafc':'none' }}>
              <img src={s.coverUrl||`https://picsum.photos/seed/${s.id}/60/80`} alt="" style={{ width:36,height:50,borderRadius:6,objectFit:'cover',flexShrink:0 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.title}</div>
                <div style={{ fontSize:11,color:'#9ca3af' }}>{s.team||'—'} · 👁 {(s.views||0).toLocaleString()}</div>
              </div>
              <div style={{ display:'flex',gap:6 }}>
                <Link to={`/admin/stories/${s.id}/editor`} style={{ fontSize:11,color:'#6366f1',background:'#ede9fe',border:'none',borderRadius:6,padding:'4px 9px',textDecoration:'none',fontWeight:700 }}>Edit</Link>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
