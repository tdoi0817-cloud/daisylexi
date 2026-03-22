// src/pages/ChapterPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getChapter, getChapters, isChapterUnlocked, unlockChapter } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import CommentSection from '../components/CommentSection'
import ShareModal from '../components/ShareModal'

export default function ChapterPage({ auth, onLoginRequest, onCoinModal }) {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()

  const [chapter, setChapter]     = useState(null)
  const [allChaps, setAllChaps]   = useState([])
  const [unlocked, setUnlocked]   = useState(false)
  const [shareOpen, setShare]     = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError]         = useState('')

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
    } catch (e) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally { setUnlocking(false) }
  }

  const currentIdx = allChaps.findIndex(c => c.id === chapterId)
  const prevChap   = allChaps[currentIdx - 1]
  const nextChap   = allChaps[currentIdx + 1]

  // Mock images for demo
  const images = chapter?.imageUrls?.length
    ? chapter.imageUrls
    : Array.from({ length: 4 }, (_, i) => `https://picsum.photos/seed/${chapterId}p${i}/600/900`)

  const isLocked = chapter?.locked && !unlocked

  const mockChapter = { id: chapterId, title: 'Đang tải...', locked: false }
  const ch = chapter || mockChapter
  const mockStory = { id: storyId, title: '...', coverUrl: `https://picsum.photos/seed/${storyId}/80/112` }

  return (
    <div>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link to={`/truyen/${storyId}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', textDecoration: 'none' }}>←</Link>
        <div style={{ flex: 1 }}>
          <Link to={`/truyen/${storyId}`} style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none', display: 'block' }}>← Quay lại truyện</Link>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{ch.title}</div>
        </div>
        <button onClick={() => setShare(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#374151' }}>
          🔗 Chia sẻ
        </button>
      </div>

      <AdBanner slot="top" />

      {/* Content */}
      {isLocked ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)', borderRadius: 16, border: '1.5px solid #ddd6fe', margin: '16px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔒</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>Chapter bị khoá</h3>
          <p style={{ margin: '0 0 22px', fontSize: 14, color: '#6b7280' }}>
            Cần <strong style={{ color: '#7c3aed', fontSize: 16 }}>{chapter?.coinCost || 5} xu</strong> để mở khoá chapter này
          </p>
          {auth.user && (
            <p style={{ margin: '-14px 0 18px', fontSize: 13, color: '#9ca3af' }}>
              Xu của bạn: <strong style={{ color: '#f59e0b' }}>{auth.user.coins || 0} xu</strong>
            </p>
          )}
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!auth.user ? (
              <button onClick={onLoginRequest}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                Đăng nhập để mở khoá
              </button>
            ) : (auth.user.coins || 0) >= (chapter?.coinCost || 5) ? (
              <button onClick={handleUnlock} disabled={unlocking}
                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 14, opacity: unlocking ? 0.7 : 1 }}>
                {unlocking ? '...' : `🪙 Dùng ${chapter?.coinCost || 5} xu để mở`}
              </button>
            ) : (
              <button onClick={onCoinModal}
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                Nạp xu ({auth.user.coins || 0}/{chapter?.coinCost || 5}) 🪙
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 18 }}>
            💡 Chia sẻ chapter miễn phí lên Facebook/TikTok để kéo bạn bè đọc!
          </p>
        </div>
      ) : (
        <div>
          {images.map((url, i) => (
            <div key={i}>
              <img src={url} alt={`Trang ${i + 1}`} style={{ width: '100%', display: 'block', marginBottom: 4, borderRadius: i === 0 ? '8px 8px 0 0' : 0 }} loading="lazy" />
              {i === 1 && <AdBanner slot="inline" />}
            </div>
          ))}
        </div>
      )}

      {/* Chapter navigation */}
      <div style={{ display: 'flex', gap: 10, margin: '20px 0', justifyContent: 'space-between' }}>
        {prevChap ? (
          <Link to={`/truyen/${storyId}/chuong/${prevChap.id}`}
            style={{ flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 16px', textAlign: 'center', textDecoration: 'none', color: '#374151', fontWeight: 700, fontSize: 13 }}>
            ← {prevChap.title}
          </Link>
        ) : <div style={{ flex: 1 }} />}
        {nextChap ? (
          <Link to={`/truyen/${storyId}/chuong/${nextChap.id}`}
            style={{ flex: 1, background: '#6366f1', border: 'none', borderRadius: 10, padding: '11px 16px', textAlign: 'center', textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {nextChap.title} →
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </div>

      {/* Comments */}
      <CommentSection
        storyId={storyId}
        chapterId={chapterId}
        user={auth.user}
        onLoginRequest={onLoginRequest}
      />

      {shareOpen && <ShareModal story={mockStory} chapter={ch} onClose={() => setShare(false)} />}
    </div>
  )
}
