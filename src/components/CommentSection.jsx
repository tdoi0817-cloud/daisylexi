// src/components/CommentSection.jsx
import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function CommentSection({ storyId, chapterId, user, onLoginRequest }) {
  const [comments, setComments] = useState([])
  const [text, setText]         = useState('')
  const [liked, setLiked]       = useState({})
  const [loading, setLoading]   = useState(false)

  // Realtime listener
  useEffect(() => {
    if (!storyId || !chapterId) return
    const q = query(
      collection(db, 'stories', storyId, 'chapters', chapterId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [storyId, chapterId])

  const submit = async () => {
    if (!user) { onLoginRequest(); return }
    if (!text.trim() || loading) return
    setLoading(true)
    try {
      await addDoc(
        collection(db, 'stories', storyId, 'chapters', chapterId, 'comments'),
        {
          uid:         user.uid,
          displayName: user.displayName || 'Độc giả',
          photoURL:    user.photoURL || '',
          text:        text.trim(),
          likes:       0,
          createdAt:   serverTimestamp(),
        }
      )
      setText('')
    } finally { setLoading(false) }
  }

  const toggleLike = async (commentId, currentLikes) => {
    const wasLiked = liked[commentId]
    setLiked(prev => ({ ...prev, [commentId]: !wasLiked }))
    await updateDoc(
      doc(db, 'stories', storyId, 'chapters', chapterId, 'comments', commentId),
      { likes: increment(wasLiked ? -1 : 1) }
    )
  }

  const formatTime = (ts) => {
    if (!ts) return 'Vừa xong'
    const d  = ts.toDate ? ts.toDate() : new Date(ts)
    const s  = Math.floor((Date.now() - d) / 1000)
    if (s < 60)   return 'Vừa xong'
    if (s < 3600) return `${Math.floor(s/60)} phút trước`
    if (s < 86400) return `${Math.floor(s/3600)} giờ trước`
    return `${Math.floor(s/86400)} ngày trước`
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        💬 Bình luận <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>({comments.length})</span>
      </h4>

      {/* Input box */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user ? (user.displayName?.[0] || '👤') : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={user ? 'Viết bình luận...' : 'Đăng nhập để bình luận'}
            rows={2}
            readOnly={!user}
            onClick={() => !user && onLoginRequest()}
            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submit()}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Ctrl+Enter để gửi</span>
            <button onClick={submit} disabled={loading || !text.trim()}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: (!text.trim() || loading) ? 0.5 : 1 }}>
              {loading ? '...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {comments.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>Chưa có bình luận. Hãy là người đầu tiên! 🎉</p>
      )}

      {comments.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            {c.photoURL
              ? <img src={c.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (c.displayName?.[0] || '👤')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{c.displayName}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatTime(c.createdAt)}</span>
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{c.text}</p>
            <button onClick={() => toggleLike(c.id, c.likes)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: liked[c.id] ? '#ef4444' : '#9ca3af', fontSize: 12, padding: 0, fontWeight: liked[c.id] ? 700 : 400 }}>
              {liked[c.id] ? '❤️' : '🤍'} {(c.likes || 0) + (liked[c.id] ? 1 : 0)}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
