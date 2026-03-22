// src/components/Header.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Header({ user, onLoginClick, onCoinClick, onLogout }) {
  const [search, setSearch]   = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`)
    else navigate('/')
  }

  const NAV = [
    { label:'Thể loại',       path:'/the-loai',  icon:'🏷' },
    { label:'Tạo ảnh',        path:'/tao-anh',   icon:'🎨' },
    { label:'Cộng Tác Viên',  path:'/ctv',       icon:'✍️', highlight:true },
    { label:'Team',           path:'/team',      icon:'👥' },
  ]

  return (
    <header style={{ background:'#fff', borderBottom:'1px solid #eef0f4', position:'sticky', top:0, zIndex:100 }}>
      {/* Top row: logo + search + login */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 20px' }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:'1.5px solid #e2e8f0' }}>🐱</div>
          <span style={{ fontWeight:800, fontSize:16, color:'#1e293b', whiteSpace:'nowrap' }}>Mèo Kam Mập</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm truyện theo tiêu đề..."
            style={{ width:'100%', padding:'9px 14px 9px 38px', border:'1.5px solid #e8eaf0', borderRadius:24, fontSize:13, outline:'none', background:'#f8fafc', color:'#374151', boxSizing:'border-box', transition:'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='#e8eaf0'}
          />
        </form>

        {/* Auth area */}
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'relative' }}>
            <button onClick={onCoinClick}
              style={{ display:'flex', alignItems:'center', gap:5, background:'#fef3c7', border:'1.5px solid #fde68a', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700, color:'#92400e' }}>
              🪙 {user.coins ?? 0} xu
            </button>
            <div onClick={() => setMenuOpen(o => !o)}
              style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', cursor:'pointer', flexShrink:0, background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, border:'2px solid #e2e8f0' }}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : (user.displayName?.[0] || 'U')}
            </div>
            {menuOpen && (
              <div style={{ position:'absolute', top:44, right:0, background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 8px 28px rgba(0,0,0,0.12)', minWidth:190, zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{user.displayName || 'Độc giả'}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{user.email}</div>
                </div>
                {[
                  { label:'🪙 Nạp xu', action: onCoinClick },
                  { label:'📚 Truyện đã mở khoá', action: () => navigate('/unlocked') },
                  { label:'🚪 Đăng xuất', action: () => { onLogout(); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); setMenuOpen(false) }}
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
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontWeight:700, fontSize:14, color:'#374151', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:16 }}>→</span> Đăng nhập
          </button>
        )}
      </div>

      {/* Nav row — giống screenshot */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:6, padding:'6px 20px 10px' }}>
        {NAV.map(tab => {
          const active = location.pathname === tab.path
          return (
            <Link key={tab.path} to={tab.path}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 16px', borderRadius:20, fontSize:13, fontWeight: tab.highlight ? 800 : 600, textDecoration:'none', transition:'all 0.15s',
                color: tab.highlight ? '#6366f1' : active ? '#6366f1' : '#6b7280',
                background: active ? '#ede9fe' : 'transparent' }}>
              {tab.icon} {tab.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
