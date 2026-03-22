// src/components/Header.jsx — Readunlocked (English UI)
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Header({ user, onLoginClick, onCoinClick, onLogout, translateEnabled, onToggleTranslate }) {
  const [search, setSearch]     = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`)
    else navigate('/')
  }

  const NAV = [
    { label:'Genres',       path:'/genres',  icon:'🏷️' },
    { label:'AI Art',       path:'/ai-art',  icon:'🎨' },
    { label:'Contributors', path:'/ctv',     icon:'✍️', highlight:true },
    { label:'Team',         path:'/team',    icon:'👥' },
  ]

  return (
    <header style={{ background:'#fff', borderBottom:'1px solid #eef0f4', position:'sticky', top:0, zIndex:100 }}>
      {/* Top row */}
      <div className="header-top app-wrapper" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px' }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📖</div>
          <span className="header-logo-text" style={{ fontWeight:900, fontSize:16, color:'#1e293b', whiteSpace:'nowrap', letterSpacing:'-0.5px' }}>
            Read<span style={{ color:'#6366f1' }}>unlocked</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex:1, position:'relative', minWidth:0 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13, pointerEvents:'none' }}>🔍</span>
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stories..."
            style={{ width:'100%', padding:'8px 12px 8px 34px', border:'1.5px solid #e8eaf0', borderRadius:22, fontSize:14, outline:'none', background:'#f8fafc', color:'#374151', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='#e8eaf0'}
          />
        </form>

        {/* Translate toggle */}
        <button onClick={onToggleTranslate}
          title={translateEnabled ? 'Translation ON — select any text' : 'Click to enable inline translation'}
          style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.2s',
            background:   translateEnabled ? '#ede9fe' : '#f8fafc',
            color:        translateEnabled ? '#6d28d9' : '#6b7280',
            borderColor:  translateEnabled ? '#c4b5fd' : '#e2e8f0' }}>
          🌐 {translateEnabled ? 'Translate ON' : 'Translate'}
        </button>

        {/* Auth */}
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, position:'relative' }}>
            <button onClick={onCoinClick}
              style={{ display:'flex', alignItems:'center', gap:4, background:'#fef3c7', border:'1.5px solid #fde68a', borderRadius:20, padding:'5px 10px', cursor:'pointer', fontSize:12, fontWeight:700, color:'#92400e', whiteSpace:'nowrap' }}>
              🪙 {user.coins ?? 0}
            </button>
            <div onClick={() => setMenuOpen(o => !o)}
              style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden', cursor:'pointer', flexShrink:0, background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : (user.displayName?.[0] || 'U')}
            </div>
            {menuOpen && (
              <div style={{ position:'absolute', top:42, right:0, background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 8px 28px rgba(0,0,0,0.12)', minWidth:180, zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{user.displayName || 'Reader'}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{user.email}</div>
                </div>
                {[
                  { label:'🪙 Top up coins',      fn: onCoinClick },
                  { label:'📚 Unlocked chapters',  fn: () => navigate('/unlocked') },
                  ...(user.role==='admin'||user.role==='ctv' ? [{ label:'⚙️ Dashboard', fn: () => navigate('/admin') }] : []),
                  { label:'🚪 Sign out',           fn: () => { onLogout(); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.fn(); setMenuOpen(false) }}
                    style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 16px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#374151' }}
                    onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background='none'}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLoginClick}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, background:'#6366f1', color:'#fff', border:'none', borderRadius:20, padding:'7px 16px', cursor:'pointer', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
            Sign in
          </button>
        )}
      </div>

      {/* Nav row */}
      <div className="nav-row app-wrapper" style={{ display:'flex', justifyContent:'flex-end', gap:4, padding:'4px 16px 8px', overflowX:'auto' }}>
        {NAV.map(tab => {
          const active = location.pathname === tab.path
          return (
            <Link key={tab.path} to={tab.path} className="nav-tab"
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:tab.highlight?800:600, textDecoration:'none', whiteSpace:'nowrap', transition:'all 0.15s',
                color:      tab.highlight?'#6366f1':active?'#6366f1':'#6b7280',
                background: active?'#ede9fe':'transparent' }}>
              {tab.icon} {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Translate hint bar */}
      {translateEnabled && (
        <div style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6)', padding:'6px 20px', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#fff' }}>
          <span>🌐</span>
          <span><strong>Translation active</strong> — select / highlight any text to translate it instantly</span>
          <button onClick={onToggleTranslate} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', borderRadius:8, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>Disable</button>
        </div>
      )}
    </header>
  )
}
