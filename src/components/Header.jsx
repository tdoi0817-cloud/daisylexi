// src/components/Header.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const CoinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
  </svg>
)

export default function Header({ user, onLoginClick, onCoinClick, onLogout }) {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '10px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 24 }}>🐱</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1e1b4b', whiteSpace: 'nowrap' }}>Mèo Kam Mập</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm truyện theo tiêu đề..."
            style={{
              width: '100%', padding: '8px 14px',
              border: '1px solid #e2e8f0', borderRadius: 20,
              fontSize: 13, outline: 'none', background: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />
        </form>

        {/* Right side */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
            {/* Coin button */}
            <button onClick={onCoinClick} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: 20, padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#92400e',
            }}>
              <CoinIcon /> {user.coins ?? 0}
            </button>

            {/* Avatar + menu */}
            <div
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: user.photoURL ? 'transparent' : '#6366f1',
                overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.displayName?.[0] || 'U')}
            </div>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: 42, right: 0,
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 180, zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{user.displayName || 'Độc giả'}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user.email}</div>
                </div>
                {[
                  { label: '🪙 Nạp xu', action: onCoinClick },
                  { label: '📚 Truyện đã mở khoá', action: () => navigate('/unlocked') },
                  { label: '🚪 Đăng xuất', action: () => { onLogout(); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); setMenuOpen(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#374151',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLoginClick} style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 20,
            padding: '8px 18px', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
          }}>
            Đăng nhập
          </button>
        )}
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { label: '🏠 Trang chủ', path: '/' },
          { label: '📂 Thể loại', path: '/the-loai' },
          { label: '🎨 Tạo ảnh AI', path: '/tao-anh' },
          { label: '✍️ Cộng Tác Viên', path: '/ctv' },
          { label: '👥 Team', path: '/team' },
        ].map(tab => (
          <Link key={tab.path} to={tab.path}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textDecoration: 'none', color: '#6b7280', whiteSpace: 'nowrap',
              background: '#f1f5f9',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#6366f1' }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#6b7280' }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
