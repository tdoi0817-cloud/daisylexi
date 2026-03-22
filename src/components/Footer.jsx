// src/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #e8eaf0', marginTop: 40 }}>
      <div className="app-wrapper" style={{ padding: '36px 20px 20px' }}>

        {/* Top section */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 32 }}>

          {/* Brand */}
          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🐱</div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>Mèo Kam Mập</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
              Kho truyện full &amp; ngôn tình tuyển chọn – đọc mượt, giao diện hiện đại, nhiều chế độ nền.
            </p>
          </div>

          {/* Top danh sách truyện */}
          <div style={{ flex: '1 1 180px', minWidth: 160 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Top danh sách truyện</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Top truyện ngôn tình hay nhất',
                'Top ngôn tình hiện đại',
                'Top truyện xuyên không',
                'Top truyện tổng tài hot',
                'Top truyện quân nhân hot',
              ].map(item => (
                <Link key={item} to="/" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
                  • {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Thông tin */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Thông tin</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'ℹ️', label: 'Giới thiệu',           path: '/gioi-thieu' },
                { icon: '🔒', label: 'Chính sách bảo mật',   path: '/chinh-sach' },
                { icon: '📄', label: 'Điều khoản sử dụng',   path: '/dieu-khoan' },
              ].map(item => (
                <Link key={item.label} to={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', textDecoration: 'none' }}
                  onMouseOver={e => e.currentTarget.style.color = '#6366f1'}
                  onMouseOut={e => e.currentTarget.style.color = '#374151'}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Kết nối */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Kết nối</h4>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>Theo dõi để nhận thông báo chương mới:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#f0f2ff', borderRadius: 10, textDecoration: 'none', color: '#1877f2', fontWeight: 700, fontSize: 13, border: '1px solid #c7d2fe' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Fanpage
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff5f5', borderRadius: 10, textDecoration: 'none', color: '#ef4444', fontWeight: 700, fontSize: 13, border: '1px solid #fecaca' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
            © 2025 Mèo Kam Mập. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
