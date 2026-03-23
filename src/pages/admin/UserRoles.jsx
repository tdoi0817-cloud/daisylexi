// src/pages/admin/UserRoles.jsx — Full User Management Dashboard
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, limit, where, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

const ROLES = [
  { value:'reader', label:'Reader', bg:'#f1f5f9', color:'#6b7280',  desc:'Read only' },
  { value:'ctv',    label:'CTV',    bg:'#dcfce7', color:'#166534',  desc:'Upload stories' },
  { value:'admin',  label:'Admin',  bg:'#ede9fe', color:'#6d28d9',  desc:'Full access' },
]

function fmt(n) {
  if (!n) return '0'
  if (n>=1000000) return (n/1000000).toFixed(1)+'M'
  if (n>=1000)    return (n/1000).toFixed(0)+'K'
  return String(n)
}
function timeAgo(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now()-d)/1000)
  if (isNaN(s)) return '—'
  if (s<60)    return 'just now'
  if (s<3600)  return Math.floor(s/60)+'m ago'
  if (s<86400) return Math.floor(s/3600)+'h ago'
  return Math.floor(s/86400)+'d ago'
}

// ── User Detail Modal ─────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const [form, setForm]     = useState({...user})
  const [stories, setStories] = useState([])
  const [saving, setSaving]   = useState(false)
  const [tab, setTab]         = useState('profile')

  useEffect(() => {
    getDocs(query(collection(db,'stories'), where('authorUid','==',user.id), orderBy('createdAt','desc'), limit(10)))
      .then(snap => setStories(snap.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{})
  }, [user.id])

  const save = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db,'users',user.id), {
        displayName: form.displayName||'',
        role:        form.role||'reader',
        status:      form.status||'approved',
        bio:         form.bio||'',
        notes:       form.notes||'',
        updatedAt:   serverTimestamp(),
      })
      onSave({...user,...form})
      onClose()
    } catch(e) { alert('Error: '+e.message) }
    finally { setSaving(false) }
  }

  const IS = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:580,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding:'18px 20px 0',borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
            <div style={{ width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:20,fontWeight:800,flexShrink:0,overflow:'hidden' }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : (user.displayName?.[0]||'U')}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:800,fontSize:16,color:'#1e293b' }}>{user.displayName||'Unknown'}</div>
              <div style={{ fontSize:12,color:'#6b7280' }}>{user.email}</div>
            </div>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,color:'#9ca3af',cursor:'pointer' }}>×</button>
          </div>
          <div style={{ display:'flex',gap:0 }}>
            {[['profile','👤 Profile'],['performance','📊 Performance'],['activity','🕐 Activity']].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)}
                style={{ padding:'8px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:700,color:tab===k?'#6366f1':'#9ca3af',borderBottom:tab===k?'2px solid #6366f1':'2px solid transparent' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>
          {tab==='profile' && (
            <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Display Name</label>
                  <input value={form.displayName||''} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))} style={IS} /></div>
                <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Email</label>
                  <input value={form.email||''} disabled style={{ ...IS,background:'#f8fafc',color:'#9ca3af' }} /></div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Role</label>
                  <select value={form.role||'reader'} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={IS}>
                    {ROLES.map(r=><option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                  </select></div>
                <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Status</label>
                  <select value={form.status||'approved'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={IS}>
                    <option value="approved">✅ Active</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="suspended">🚫 Suspended</option>
                  </select></div>
              </div>
              <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Bio</label>
                <textarea value={form.bio||''} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={3} style={{ ...IS,resize:'vertical' }} placeholder="User bio..." /></div>
              <div><label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Admin Notes (private)</label>
                <textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ ...IS,resize:'vertical',background:'#fffbec' }} placeholder="Internal notes..." /></div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,background:'#f8fafc',padding:'12px',borderRadius:10 }}>
                {[
                  ['Joined', user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '—'],
                  ['Coins',  '🪙 '+(user.coins||0)],
                  ['Provider', user.provider||'email'],
                  ['Last seen', timeAgo(user.updatedAt||user.createdAt)],
                ].map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:10,color:'#9ca3af' }}>{l}</div><div style={{ fontSize:12,fontWeight:600,marginTop:2 }}>{v}</div></div>
                ))}
              </div>
            </div>
          )}

          {tab==='performance' && (
            <div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14 }}>
                {[
                  { l:'Stories', v:stories.length, i:'📚', bg:'#ede9fe', c:'#6d28d9' },
                  { l:'Total Views', v:fmt(stories.reduce((a,s)=>a+(s.views||0),0)), i:'👁', bg:'#dcfce7', c:'#166534' },
                  { l:'Total Likes', v:fmt(stories.reduce((a,s)=>a+(s.likes||0),0)), i:'❤️', bg:'#fef2f2', c:'#ef4444' },
                ].map(s=>(
                  <div key={s.l} style={{ background:s.bg,borderRadius:10,padding:'12px' }}>
                    <div style={{ fontSize:16,marginBottom:4 }}>{s.i}</div>
                    <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10,color:s.c,opacity:0.8 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {stories.length===0 ? (
                <div style={{ textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:13,background:'#f8fafc',borderRadius:10 }}>No stories posted yet.</div>
              ) : stories.map(s=>(
                <div key={s.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#f8fafc',borderRadius:10,marginBottom:8 }}>
                  {s.coverUrl&&<img src={s.coverUrl} alt="" style={{ width:36,height:50,borderRadius:6,objectFit:'cover',flexShrink:0 }} />}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.title}</div>
                    <div style={{ fontSize:11,color:'#9ca3af' }}>{timeAgo(s.createdAt)}</div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontSize:12,fontWeight:700 }}>👁 {fmt(s.views||0)}</div>
                    <div style={{ fontSize:11,color:'#9ca3af' }}>❤️ {fmt(s.likes||0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='activity' && (
            <div style={{ textAlign:'center',padding:'32px 20px',color:'#9ca3af' }}>
              <div style={{ fontSize:36,marginBottom:8 }}>🕐</div>
              <p style={{ fontSize:13 }}>Activity log coming soon.<br/>Will track logins, uploads, comments, purchases.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',gap:10 }}>
          <button onClick={onClose} style={{ padding:'9px 20px',background:'#f1f5f9',border:'none',borderRadius:10,fontWeight:700,fontSize:13,cursor:'pointer',color:'#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'9px 24px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:10,fontWeight:800,fontSize:13,cursor:'pointer',color:'#fff',opacity:saving?0.7:1 }}>
            {saving?'Saving...':'💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function UserRoles() {
  const [users, setUsers]      = useState([])
  const [loading, setLoading]  = useState(true)
  const [search, setSearch]    = useState('')
  const [roleFilter, setRoleF] = useState('all')
  const [statFilter, setStatF] = useState('all')
  const [selected, setSelected]= useState(null)
  const [toast, setToast]      = useState('')
  const [tab, setTab]          = useState('all')

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db,'users'), orderBy('createdAt','desc'), limit(200)))
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const changeRole = async (uid, role, e) => {
    e.stopPropagation()
    try {
      await updateDoc(doc(db,'users',uid), { role, updatedAt:serverTimestamp() })
      setUsers(us=>us.map(u=>u.id===uid?{...u,role}:u))
      showToast('✅ Role updated!')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const changeStatus = async (uid, status, e) => {
    e.stopPropagation()
    try {
      await updateDoc(doc(db,'users',uid), { status, updatedAt:serverTimestamp() })
      setUsers(us=>us.map(u=>u.id===uid?{...u,status}:u))
      showToast(status==='approved'?'✅ User approved!':'🚫 User suspended!')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const deleteUser = async (uid, e) => {
    e.stopPropagation()
    if (!confirm('Delete this user permanently?')) return
    try {
      await deleteDoc(doc(db,'users',uid))
      setUsers(us=>us.filter(u=>u.id!==uid))
      showToast('🗑 Deleted.')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const pending  = users.filter(u=>u.status==='pending')
  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const ms = !q||(u.displayName||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)
    const mr = roleFilter==='all'||u.role===roleFilter
    const mst= statFilter==='all'||(u.status||'approved')===statFilter
    const mt = tab==='pending'?(u.status==='pending'):true
    return ms&&mr&&mst&&mt
  })

  const StatusBadge = ({status}) => {
    const s = status||'approved'
    const cfg = {approved:{bg:'#dcfce7',c:'#166534',l:'✅ Active'},pending:{bg:'#fef9ec',c:'#92400e',l:'⏳ Pending'},suspended:{bg:'#fef2f2',c:'#ef4444',l:'🚫 Suspended'}}
    const v = cfg[s]||cfg.approved
    return <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:v.bg,color:v.c,whiteSpace:'nowrap' }}>{v.l}</span>
  }

  return (
    <AdminGuard require="admin">
      <div style={{ maxWidth:960 }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#1e293b',color:'#fff',padding:'10px 22px',borderRadius:30,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <h2 style={{ margin:'0 0 4px',fontSize:20,fontWeight:800 }}>👥 User Management</h2>
        <p style={{ margin:'0 0 18px',fontSize:13,color:'#6b7280' }}>Manage roles, approve members, track performance</p>

        {/* KPIs */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18 }}>
          {[
            { l:'Total Users',    v:users.length,                                              i:'👥', bg:'#ede9fe', c:'#6d28d9', click:()=>{setTab('all');setStatF('all')} },
            { l:'Contributors',   v:users.filter(u=>u.role==='ctv').length,                    i:'✍️', bg:'#dcfce7', c:'#166534', click:()=>{setTab('all');setRoleF('ctv')} },
            { l:'Active',         v:users.filter(u=>!u.status||u.status==='approved').length,  i:'✅', bg:'#f0fdf4', c:'#166534', click:()=>{setTab('all');setStatF('approved')} },
            { l:'Pending',        v:pending.length,                                             i:'⏳', bg:'#fef9ec', c:'#92400e', click:()=>{setTab('pending');setStatF('pending')}, alert:pending.length>0 },
          ].map(s=>(
            <div key={s.l} onClick={s.click}
              style={{ background:s.bg,borderRadius:12,padding:'14px 12px',cursor:'pointer',border:s.alert?`2px solid ${s.c}30`:'2px solid transparent',transition:'transform 0.15s' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e=>e.currentTarget.style.transform='none'}>
              <div style={{ fontSize:20,marginBottom:4 }}>{s.i}</div>
              <div style={{ fontSize:22,fontWeight:800,color:s.c }}>{s.v}</div>
              <div style={{ fontSize:11,color:s.c,opacity:0.8 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Pending banner */}
        {pending.length>0 && (
          <div style={{ background:'#fef9ec',border:'1.5px solid #fde68a',borderRadius:12,padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800,fontSize:13,color:'#92400e' }}>{pending.length} user{pending.length>1?'s':''} awaiting approval</div>
              <div style={{ fontSize:11,color:'#a16207' }}>New sign-ups via email / Google / Facebook</div>
            </div>
            <button onClick={()=>{setTab('pending');setStatF('pending')}}
              style={{ background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:800,fontSize:12,cursor:'pointer' }}>
              Review →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex',background:'#f1f5f9',borderRadius:12,padding:3,marginBottom:14 }}>
          {[['all',`All Users (${users.length})`],['pending',`⏳ Pending (${pending.length})`]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setStatF(k==='pending'?'pending':'all')}}
              style={{ flex:1,padding:'9px',border:'none',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:13,background:tab===k?'#fff':'transparent',color:tab===k?'#6366f1':'#6b7280',boxShadow:tab===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search name or email..."
            style={{ flex:1,minWidth:180,padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit' }}
            onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          <select value={roleFilter} onChange={e=>setRoleF(e.target.value)}
            style={{ padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit' }}>
            <option value="all">All Roles</option>
            {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={statFilter} onChange={e=>setStatF(e.target.value)}
            style={{ padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit' }}>
            <option value="all">All Status</option>
            <option value="approved">✅ Active</option>
            <option value="pending">⏳ Pending</option>
            <option value="suspended">🚫 Suspended</option>
          </select>
          <button onClick={load} style={{ padding:'8px 14px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',color:'#374151' }}>
            🔄
          </button>
        </div>

        <div style={{ fontSize:11,color:'#9ca3af',marginBottom:8 }}>Showing {filtered.length} / {users.length} users · Click a row to edit</div>

        {/* Table */}
        <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid',gridTemplateColumns:'minmax(180px,2fr) 100px 110px 100px 120px 110px',background:'#f8fafc',padding:'10px 14px',borderBottom:'1px solid #f1f5f9' }}>
            {['User','Role','Status','Last Active','Performance','Actions'].map(h=>(
              <div key={h} style={{ fontSize:10,fontWeight:700,color:'#9ca3af',letterSpacing:0.5 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:'center',padding:'40px',color:'#9ca3af' }}>⏳ Loading users...</div>
          ) : filtered.length===0 ? (
            <div style={{ textAlign:'center',padding:'36px',color:'#9ca3af' }}>
              <div style={{ fontSize:28,marginBottom:8 }}>🔍</div>
              No users found.
            </div>
          ) : filtered.map(u=>(
            <div key={u.id} onClick={()=>setSelected(u)}
              style={{ display:'grid',gridTemplateColumns:'minmax(180px,2fr) 100px 110px 100px 120px 110px',padding:'11px 14px',borderBottom:'1px solid #f8fafc',cursor:'pointer',transition:'background 0.1s',alignItems:'center' }}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>

              {/* User */}
              <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0 }}>
                <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:800,flexShrink:0,overflow:'hidden' }}>
                  {u.photoURL?<img src={u.photoURL} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />:(u.displayName?.[0]||'?')}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.displayName||'—'}</div>
                  <div style={{ fontSize:10,color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.email}</div>
                </div>
              </div>

              {/* Role */}
              <div onClick={e=>e.stopPropagation()}>
                <select value={u.role||'reader'} onChange={e=>changeRole(u.id,e.target.value,e)}
                  style={{ fontSize:11,fontWeight:700,padding:'4px 8px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',outline:'none',width:'100%' }}>
                  {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Status */}
              <div><StatusBadge status={u.status} /></div>

              {/* Last active */}
              <div style={{ fontSize:11,color:'#6b7280' }}>{timeAgo(u.updatedAt||u.createdAt)}</div>

              {/* Performance */}
              <div style={{ fontSize:11,color:'#6b7280',lineHeight:1.6 }}>
                <div>📚 {u.stories||0} stories</div>
                <div>👁 {fmt(u.totalViews||0)} views</div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex',gap:4,flexWrap:'wrap' }} onClick={e=>e.stopPropagation()}>
                {(!u.status||u.status==='pending') && (
                  <button onClick={e=>changeStatus(u.id,'approved',e)} title="Approve"
                    style={{ padding:'5px 8px',background:'#dcfce7',border:'none',borderRadius:6,fontSize:11,fontWeight:700,color:'#166534',cursor:'pointer' }}>✅</button>
                )}
                {u.status==='approved' && (
                  <button onClick={e=>changeStatus(u.id,'suspended',e)} title="Suspend"
                    style={{ padding:'5px 8px',background:'#fef2f2',border:'none',borderRadius:6,fontSize:11,color:'#ef4444',cursor:'pointer' }}>🚫</button>
                )}
                {u.status==='suspended' && (
                  <button onClick={e=>changeStatus(u.id,'approved',e)} title="Reactivate"
                    style={{ padding:'5px 8px',background:'#dcfce7',border:'none',borderRadius:6,fontSize:11,color:'#166534',cursor:'pointer' }}>↩️</button>
                )}
                <button onClick={e=>deleteUser(u.id,e)} title="Delete"
                  style={{ padding:'5px 8px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:6,fontSize:11,color:'#9ca3af',cursor:'pointer' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:14,padding:'11px 14px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,fontSize:12,color:'#166534' }}>
          💡 Click any row to view full profile + performance + edit all details. Role changes apply instantly.
        </div>

        {selected && (
          <UserModal user={selected} onClose={()=>setSelected(null)}
            onSave={updated=>{setUsers(us=>us.map(u=>u.id===updated.id?{...u,...updated}:u));showToast('✅ Saved!')}} />
        )}
      </div>
    </AdminGuard>
  )
}
