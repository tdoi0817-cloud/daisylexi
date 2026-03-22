// src/App.jsx
import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f4f6f9' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🐱</div>
          <div style={{ fontSize:13, color:'#6b7280' }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6f9' }}>
      <Header
        user={auth.user}
        onLoginClick={() => setShowAuth(true)}
        onCoinClick={() => setShowCoin(true)}
        onLogout={auth.logout}
      />

      {/* Page content — co giãn theo màn hình */}
      <div className="app-wrapper page-content">
        <Routes>
          <Route path="/"
            element={<HomePage auth={auth} onLoginRequest={() => setShowAuth(true)} />} />
          <Route path="/truyen/:storyId"
            element={<StoryPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
          <Route path="/truyen/:storyId/chuong/:chapterId"
            element={<ChapterPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
        </Routes>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginGoogle={async () => { await auth.loginGoogle(); setShowAuth(false) }}
          onLoginFacebook={async () => { await auth.loginFacebook(); setShowAuth(false) }}
          onLoginEmail={async (e,p) => { await auth.loginEmail(e,p); setShowAuth(false) }}
          onRegister={async (e,p,n) => { await auth.registerEmail(e,p,n); setShowAuth(false) }}
        />
      )}

      {showCoin && auth.user && (
        <CoinModal
          currentCoins={auth.user.coins}
          onClose={() => setShowCoin(false)}
          onPurchase={async (n) => { await auth.updateCoins(n); setShowCoin(false) }}
        />
      )}

      {/* Chat bubble */}
      <div title="Chat hỗ trợ"
        style={{ position:'fixed', bottom:20, right:16, width:48, height:48, background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 16px rgba(99,102,241,0.45)', cursor:'pointer', zIndex:50 }}>
        💬
      </div>
    </div>
  )
}
