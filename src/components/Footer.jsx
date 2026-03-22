// src/components/Footer.jsx — English / Readunlocked
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background:'#fff', borderTop:'1px solid #e8eaf0', marginTop:40 }}>
      <div className="app-wrapper" style={{ padding:'36px 20px 20px' }}>
        <div style={{ display:'flex', gap:40, flexWrap:'wrap', marginBottom:32 }}>

          {/* Brand */}
          <div style={{ flex:'1 1 220px', minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📖</div>
              <span style={{ fontWeight:900, fontSize:16, color:'#1e293b', letterSpacing:'-0.5px' }}>
                Read<span style={{ color:'#6366f1' }}>unlocked</span>
              </span>
            </div>
            <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.7 }}>
              Premium manga & webcomic platform — read free, unlock more. Built for global readers.
            </p>
          </div>

          {/* Browse */}
          <div style={{ flex:'1 1 160px', minWidth:140 }}>
            <h4 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#1e293b' }}>Browse</h4>
            {['Top Romance','Top Action','Top Fantasy','Recently Updated','Completed Series'].map(item => (
              <Link key={item} to="/" style={{ display:'block', fontSize:13, color:'#6b7280', textDecoration:'none', marginBottom:8 }}
                onMouseOver={e => e.currentTarget.style.color='#6366f1'}
                onMouseOut={e => e.currentTarget.style.color='#6b7280'}>
                • {item}
              </Link>
            ))}
          </div>

          {/* Info */}
          <div style={{ flex:'1 1 140px', minWidth:130 }}>
            <h4 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#1e293b' }}>Info</h4>
            {[
              { icon:'ℹ️', label:'About Us',       path:'/about' },
              { icon:'🔒', label:'Privacy Policy',  path:'/privacy' },
              { icon:'📄', label:'Terms of Use',    path:'/terms' },
              { icon:'✍️', label:'Become a Translator', path:'/ctv' },
            ].map(item => (
              <Link key={item.label} to={item.path}
                style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#374151', textDecoration:'none', marginBottom:8 }}
                onMouseOver={e => e.currentTarget.style.color='#6366f1'}
                onMouseOut={e => e.currentTarget.style.color='#374151'}>
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>

          {/* Social */}
          <div style={{ flex:'1 1 140px', minWidth:130 }}>
            <h4 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#1e293b' }}>Follow Us</h4>
            <p style={{ margin:'0 0 12px', fontSize:13, color:'#6b7280' }}>Get notified about new chapters:</p>
            {[
              { icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, label:'Facebook', bg:'#f0f2ff', color:'#1877f2', border:'#c7d2fe' },
              { icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, label:'YouTube', bg:'#fff5f5', color:'#ef4444', border:'#fecaca' },
            ].map(s => (
              <a key={s.label} href="#" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', background:s.bg, borderRadius:10, textDecoration:'none', color:s.color, fontWeight:700, fontSize:13, border:`1px solid ${s.border}`, marginBottom:8, marginRight:8 }}>
                {s.icon} {s.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>© 2025 Readunlocked. All rights reserved.</p>
          <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>🌐 Available in multiple languages</p>
        </div>
      </div>
    </footer>
  )
}
