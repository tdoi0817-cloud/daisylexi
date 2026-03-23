// src/App.jsx — Readunlocked
import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import HomePage       from './pages/HomePage'
import StoryPage      from './pages/StoryPage'
import ChapterPage    from './pages/ChapterPage'
import TeamPage       from './pages/TeamPage'
import AuthModal      from './components/AuthModal'
import CoinModal      from './components/CoinModal'
import Header         from './components/Header'
import Footer         from './components/Footer'
import TranslateTooltip from './components/TranslateTooltip'

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StoriesList    from './pages/admin/StoriesList'
import StoryForm      from './pages/admin/StoryForm'
import ChapterManager from './pages/admin/ChapterManager'
import UserRoles      from './pages/admin/UserRoles'
import AIGenerate     from './pages/admin/AIGenerate'
import BulkUpload     from './pages/admin/BulkUpload'
import SEOManager     from './pages/admin/SEOManager'

export default function App() {
  const auth = useAuth()
  const [showAuth, setShowAuth]           = useState(false)
  const [showCoin, setShowCoin]           = useState(false)
  const [translateEnabled, setTranslate]  = useState(false)

  if (auth.loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f4f6f9' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>📖</div>
        <div style={{ fontSize:14, color:'#6b7280', fontWeight:600 }}>Loading Readunlocked...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6f9' }}>
      <Header
        user={auth.user}
        onLoginClick={() => setShowAuth(true)}
        onCoinClick={() => setShowCoin(true)}
        onLogout={auth.logout}
        translateEnabled={translateEnabled}
        onToggleTranslate={() => setTranslate(t => !t)}
      />

      {/* Global translate tooltip — active on ALL pages when enabled */}
      <TranslateTooltip enabled={translateEnabled} />

      <div className="app-wrapper page-content">
        <Routes>
          {/* Public */}
          <Route path="/"    element={<HomePage auth={auth} onLoginRequest={() => setShowAuth(true)} />} />
          <Route path="/truyen/:storyId"
            element={<StoryPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
          <Route path="/truyen/:storyId/chuong/:chapterId"
            element={<ChapterPage auth={auth} onLoginRequest={() => setShowAuth(true)} onCoinModal={() => setShowCoin(true)} />} />
          <Route path="/team" element={<TeamPage auth={auth} />} />
          <Route path="/contributors" element={<CTVPage auth={auth} onLoginRequest={() => setShowAuth(true)} />} />
          <Route path="/ctv"  element={<TeamPage auth={auth} />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                              element={<AdminDashboard />} />
            <Route path="stories"                     element={<StoriesList />} />
            <Route path="stories/new"                 element={<StoryForm />} />
            <Route path="stories/:storyId/edit"       element={<StoryForm />} />
            <Route path="stories/:storyId/editor"     element={<StoryEditor />} />
            <Route path="stories/:storyId/chapters"   element={<ChapterManager />} />
            <Route path="stories/:storyId/bulk-upload" element={<BulkUpload />} />
            <Route path="users"                       element={<UserRoles />} />
            <Route path="roles"                       element={<UserRoles />} />
            <Route path="ai-generate"                 element={<AIGenerate />} />
            <Route path="bulk-upload"                 element={<BulkUpload />} />
            <Route path="seo"                         element={<SEOManager />} />
          </Route>
        </Routes>
      </div>

      <Footer />

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)}
          onLoginGoogle={async () => { await auth.loginGoogle(); setShowAuth(false) }}
          onLoginFacebook={async () => { await auth.loginFacebook(); setShowAuth(false) }}
          onLoginEmail={async (e,p) => { await auth.loginEmail(e,p); setShowAuth(false) }}
          onRegister={async (e,p,n) => { await auth.registerEmail(e,p,n); setShowAuth(false) }} />
      )}
      {showCoin && auth.user && (
        <CoinModal currentCoins={auth.user.coins} onClose={() => setShowCoin(false)}
          onPurchase={async n => { await auth.updateCoins(n); setShowCoin(false) }} />
      )}

      {/* Chat bubble */}
      <div title="Support chat"
        style={{ position:'fixed', bottom:20, right:16, width:48, height:48, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 16px rgba(99,102,241,0.45)', cursor:'pointer', zIndex:50 }}>
        💬
      </div>
    </div>
  )
}
