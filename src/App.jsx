// src/App.jsx
// ─── App root: kết nối Firebase Auth + React Router ────────────
import { useState } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Lazy import pages (code-split)
import HomePage    from './pages/HomePage'
import StoryPage   from './pages/StoryPage'
import ChapterPage from './pages/ChapterPage'
import AuthModal   from './components/AuthModal'
import CoinModal   from './components/CoinModal'
import Header      from './components/Header'

export default function App() {
  const auth = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showCoin, setShowCoin] = useState(false)

  if (auth.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 40 }}>🐱</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Header
        user={auth.user}
        onLoginClick={() => setShowAuth(true)}
        onCoinClick={() => setShowCoin(true)}
        onLogout={auth.logout}
      />

      <div style={{ padding: '16px' }}>
        <Routes>
          <Route path="/"                          element={<HomePage  auth={auth} onLoginRequest={() => setShowAuth(true)} />} />
          <Route path="/truyen/:storyId"           element={<StoryPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
          <Route path="/truyen/:storyId/chuong/:chapterId" element={<ChapterPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
        </Routes>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginGoogle={async () => { await auth.loginGoogle();   setShowAuth(false) }}
          onLoginFacebook={async () => { await auth.loginFacebook(); setShowAuth(false) }}
          onLoginEmail={async (email, pass) => { await auth.loginEmail(email, pass); setShowAuth(false) }}
          onRegister={async (email, pass, name) => { await auth.registerEmail(email, pass, name); setShowAuth(false) }}
        />
      )}

      {showCoin && auth.user && (
        <CoinModal
          currentCoins={auth.user.coins}
          onClose={() => setShowCoin(false)}
          onPurchase={async (amount) => { await auth.updateCoins(amount); setShowCoin(false) }}
        />
      )}

      {/* Chat widget */}
      <div
        title="Chat hỗ trợ"
        style={{ position: 'fixed', bottom: 20, right: 20, width: 50, height: 50, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(99,102,241,0.45)', cursor: 'pointer', zIndex: 50 }}
      >
        💬
      </div>
    </div>
  )
}
