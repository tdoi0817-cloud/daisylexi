// src/components/AuthModal.jsx
import { useState } from 'react'

const FbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const GgIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function AuthModal({ onClose, onLoginGoogle, onLoginFacebook, onLoginEmail, onRegister }) {
  const [tab, setTab]       = useState('login')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [name, setName]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const wrap = async (fn) => {
    setError(''); setLoading(true)
    try { await fn() }
    catch (e) {
      const msgs = {
        'auth/user-not-found':       'Email chưa được đăng ký.',
        'auth/wrong-password':       'Sai mật khẩu.',
        'auth/email-already-in-use': 'Email đã được sử dụng.',
        'auth/weak-password':        'Mật khẩu cần ít nhất 6 ký tự.',
        'auth/popup-closed-by-user': 'Đăng nhập bị huỷ.',
        'auth/account-exists-with-different-credential': 'Email này đã dùng phương thức đăng nhập khác.',
      }
      setError(msgs[e.code] || e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 32 }}>🐱</div>
          <h2 style={{ margin: '6px 0 4px', fontSize: 18, fontWeight: 800 }}>Mèo Kam Mập</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Đăng nhập để đọc truyện &amp; tích xu</p>
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <button disabled={loading} onClick={() => wrap(onLoginFacebook)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, background: '#1877f2', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            <FbIcon /> Tiếp tục với Facebook
          </button>
          <button disabled={loading} onClick={() => wrap(onLoginGoogle)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            <GgIcon /> Tiếp tục với Google
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>hoặc dùng email</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, marginBottom: 14 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#6366f1' : '#6b7280', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'register' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên hiển thị"
              style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
            style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Mật khẩu" type="password"
            style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />

          {error && <p style={{ margin: 0, color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

          <button disabled={loading}
            onClick={() => wrap(tab === 'login' ? () => onLoginEmail(email, pass) : () => onRegister(email, pass, name))}
            style={{ padding: 13, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản — nhận 10 xu 🎁'}
          </button>
        </div>
      </div>
    </div>
  )
}
