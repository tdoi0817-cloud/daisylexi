// src/pages/ChapterPage.jsx — Fixed: content display + mobile responsive
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getChapter, getChapters, isChapterUnlocked, unlockChapter } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import CommentSection from '../components/CommentSection'
import ShareModal from '../components/ShareModal'
import AffiliateWidget from '../components/affiliate/AffiliateWidget'

export default function ChapterPage({ auth, onLoginRequest, onCoinModal }) {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()

  const [chapter,   setChapter]   = useState(null)
  const [story,     setStory]     = useState(null)
  const [allChaps,  setAllChaps]  = useState([])
  const [unlocked,  setUnlocked]  = useState(false)
  const [shareOpen, setShare]     = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    getChapter(storyId, chapterId).then(c => { if (c) setChapter(c) })
    getChapters(storyId).then(cs => { if (cs.length) setAllChaps(cs) })
  }, [storyId, chapterId])

  useEffect(() => {
    if (!auth.user || !chapter) return
    if (!chapter.locked) { setUnlocked(true); return }
    isChapterUnlocked(auth.user.uid, storyId, chapterId).then(setUnlocked)
  }, [auth.user, chapter, storyId, chapterId])

  const handleUnlock = async () => {
    if (!auth.user) { onLoginRequest(); return }
    const cost = chapter?.coinCost || 5
    if ((auth.user.coins || 0) < cost) { onCoinModal(); return }
    setUnlocking(true)
    try {
      await unlockChapter(auth.user.uid, storyId, chapterId, cost)
      await auth.updateCoins(-cost)
      setUnlocked(true)
    } catch(e) { setError('Error unlocking. Please try again.') }
    finally { setUnlocking(false) }
  }

  const currentIdx = allChaps.findIndex(c => c.id === chapterId)
  const prevChap   = allChaps[currentIdx - 1]
  const nextChap   = allChaps[currentIdx + 1]
  const isLocked   = chapter?.locked && !unlocked
  const ch         = chapter || { id: chapterId, title: 'Loading...', locked: false }

  // ── Decide what to render: text content OR images ────────────────
  const hasTextContent = chapter?.content && chapter.content.trim().length > 30
  const hasImages      = chapter?.imageUrls && chapter.imageUrls.length > 0
  // Fallback demo images only if no real content at all
  const demoImages     = Array.from({ length: 4 }, (_, i) =>
    `https://picsum.photos/seed/${chapterId}p${i+1}/800/1200`
  )

  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'ctv'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Admin bar */}
      {isAdmin && (
        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius:12, padding:'9px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, color:'#a5b4fc', fontWeight:700, letterSpacing:1 }}>⚙️ ADMIN</span>
          <div style={{ flex:1 }} />
          <a href={`/admin/stories/${storyId}/chapters`}
            style={{ padding:'6px 12px', background:'#6366f1', color:'#fff', textDecoration:'none', borderRadius:7, fontSize:11, fontWeight:700 }}>
            ✏️ Edit Chapters
          </a>
          <a href={`/admin/stories/${storyId}/bulk-upload`}
            style={{ padding:'6px 12px', background:'rgba(255,255,255,0.15)', color:'#e2e8f0', textDecoration:'none', borderRadius:7, fontSize:11, fontWeight:700 }}>
            📤 Upload Pages
          </a>
          <a href={`/admin/stories/${storyId}/editor`}
            style={{ padding:'6px 12px', background:'rgba(255,255,255,0.15)', color:'#e2e8f0', textDecoration:'none', borderRadius:7, fontSize:11, fontWeight:700 }}>
            ⚙️ Story Settings
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .ch-nav-btn { font-size: 12px !important; padding: 9px 10px !important; }
          .ch-top-bar { flex-wrap: wrap; gap: 6px !important; }
          .ch-title   { font-size: 13px !important; }
        }
      `}</style>

      {/* ── Top nav ── */}
      <div className="ch-top-bar" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <Link to={`/truyen/${storyId}`}
          style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 12px', textDecoration:'none', color:'#374151', fontSize:13, fontWeight:600, flexShrink:0 }}>
          ← Back
        </Link>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="ch-title" style={{ fontWeight:800, fontSize:15, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {ch.title}
          </div>
        </div>
        <button onClick={() => setShare(true)}
          style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:'7px 12px', cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151', flexShrink:0 }}>
          🔗 Share
        </button>
      </div>

      <AdBanner slot="top" />

      {/* ── Locked gate ── */}
      {isLocked ? (
        <div style={{ textAlign:'center', padding:'48px 20px', background:'linear-gradient(135deg,#faf5ff,#ede9fe)', borderRadius:16, border:'1.5px solid #ddd6fe', margin:'16px 0' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>🔒</div>
          <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800 }}>Locked Chapter</h3>
          <p style={{ margin:'0 0 6px', fontSize:14, color:'#6b7280' }}>
            Unlock <strong>{ch.title}</strong> for {chapter?.coinCost || 5} coins
          </p>
          <p style={{ margin:'0 0 20px', fontSize:12, color:'#9ca3af' }}>
            Your balance: {auth.user?.coins ?? 0} coins
          </p>
          {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</p>}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            {auth.user ? (
              <button onClick={handleUnlock} disabled={unlocking}
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', cursor:'pointer', fontWeight:800, fontSize:15, opacity:unlocking?0.7:1 }}>
                {unlocking ? '...' : `🪙 Unlock for ${chapter?.coinCost||5} coins`}
              </button>
            ) : (
              <button onClick={onLoginRequest}
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', cursor:'pointer', fontWeight:800, fontSize:15 }}>
                Sign in to unlock
              </button>
            )}
            <button onClick={onCoinModal}
              style={{ background:'#fff', color:'#6366f1', border:'1.5px solid #6366f1', borderRadius:12, padding:'10px 24px', cursor:'pointer', fontWeight:700, fontSize:14 }}>
              💰 Get more coins
            </button>
          </div>
          <p style={{ fontSize:12, color:'#9ca3af', marginTop:18 }}>
            💡 Share this chapter on social media — friends get to read for free!
          </p>
        </div>

      ) : (
        /* ── Unlocked content ── */
        <div>
          {/* ══ TEXT CONTENT (for AI-generated stories) ══ */}
          {hasTextContent && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:'28px 24px', marginBottom:16, lineHeight:1.9, fontSize:16, color:'#1e293b', fontFamily:'Georgia, "Times New Roman", serif' }}>
              <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20, fontFamily:'inherit', color:'#1e293b', borderBottom:'2px solid #f1f5f9', paddingBottom:12 }}>
                {ch.title}
              </h2>
              {/* Render paragraphs */}
              {chapter.content.split('\n\n').filter(p => p.trim()).map((para, i) => (
                <div key={i}>
                  <p style={{ margin:'0 0 18px', textAlign:'justify', lineHeight:1.9 }}>
                    {para.trim()}
                  </p>
                  {i === 1 && <AdBanner slot="inline" />}
                </div>
              ))}
              {/* "To be continued" at end */}
              <div style={{ textAlign:'center', marginTop:24, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:13, color:'#9ca3af', fontStyle:'italic' }}>— End of {ch.title} —</span>
              </div>
            </div>
          )}

          {/* ══ IMAGE PAGES (for uploaded manga) ══ */}
          {hasImages && (
            <div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}>
              {chapter.imageUrls.map((url, i) => (
                <div key={i}>
                  <img src={url} alt={`Page ${i + 1}`}
                    style={{ width:'100%', display:'block', marginBottom:2 }}
                    loading="lazy"
                    onError={e => { e.target.style.display='none' }} />
                  {i === 1 && <AdBanner slot="inline" />}
                </div>
              ))}
            </div>
          )}

          {/* ══ No content — demo fallback ══ */}
          {!hasTextContent && !hasImages && (
            <div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}>
              {demoImages.map((url, i) => (
                <div key={i}>
                  <img src={url} alt={`Page ${i+1}`}
                    style={{ width:'100%', display:'block', marginBottom:2 }}
                    loading="lazy" />
                  {i === 1 && <AdBanner slot="inline" />}
                </div>
              ))}
              <div style={{ background:'#fef9ec', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginTop:8, fontSize:12, color:'#92400e', textAlign:'center' }}>
                📝 Demo images — upload real manga pages via Admin → Bulk Upload
              </div>
            </div>
          )}

          {/* Affiliate banner */}
          <AffiliateWidget
            genres={story?.genres || []}
            storyId={storyId}
            chapterId={chapterId}
            userId={auth?.user?.uid}
            variant="banner"
          />
        </div>
      )}

      {/* ── Chapter navigation ── */}
      <div style={{ display:'flex', gap:10, margin:'20px 0', flexWrap:'wrap' }}>
        {prevChap ? (
          <Link to={`/truyen/${storyId}/chuong/${prevChap.id}`} className="ch-nav-btn"
            style={{ flex:1, minWidth:120, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, padding:'11px 14px', textAlign:'center', textDecoration:'none', color:'#374151', fontWeight:700, fontSize:13 }}>
            ← {prevChap.title}
          </Link>
        ) : <div style={{ flex:1 }} />}
        {nextChap ? (
          <Link to={`/truyen/${storyId}/chuong/${nextChap.id}`} className="ch-nav-btn"
            style={{ flex:1, minWidth:120, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:10, padding:'11px 14px', textAlign:'center', textDecoration:'none', color:'#fff', fontWeight:700, fontSize:13 }}>
            {nextChap.title} →
          </Link>
        ) : <div style={{ flex:1 }} />}
      </div>

      {/* ── Comments ── */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:'16px 18px' }}>
        <CommentSection
          storyId={storyId}
          chapterId={chapterId}
          user={auth.user}
          onLoginRequest={onLoginRequest}
        />
      </div>

      {shareOpen && (
        <ShareModal
          story={{ id:storyId, title:ch.title, coverUrl:'' }}
          chapter={ch}
          onClose={() => setShare(false)}
        />
      )}
    </div>
  )
}
