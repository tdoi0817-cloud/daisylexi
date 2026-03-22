// src/components/ShareModal.jsx
import { useState } from 'react'

export default function ShareModal({ story, chapter, onClose }) {
  const [copied, setCopied] = useState(false)

  const baseUrl   = window.location.origin
  const shareUrl  = chapter
    ? `${baseUrl}/truyen/${story.id}/chuong/${chapter.id}`
    : `${baseUrl}/truyen/${story.id}`
  const shareText = chapter
    ? `📖 Đọc "${story.title}" - ${chapter.title} tại Mèo Kam Mập! Truyện hay lắm nha 🔥`
    : `📖 "${story.title}" đang hot tại Mèo Kam Mập! Đọc ngay miễn phí 👇`

  const copy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareFb = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400')

  const shareTikTok = () =>
    window.open(`https://www.tiktok.com/`, '_blank')   // TikTok không có web share API, mở app

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>

        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Chia sẻ truyện</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          {story.title}{chapter ? ` — ${chapter.title}` : ''}
        </p>

        {/* Preview card */}
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={story.coverUrl || story.cover || `https://picsum.photos/seed/${story.id}/80/112`}
            alt="" style={{ width: 56, height: 78, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#a5b4fc', fontSize: 11, marginBottom: 4 }}>meokammap.com</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{story.title}</div>
            {chapter && <div style={{ color: '#c7d2fe', fontSize: 12, marginTop: 4 }}>{chapter.title}</div>}
            <div style={{ color: '#818cf8', fontSize: 11, marginTop: 6 }}>
              ⭐ {story.rating ?? '4.8'} · 👁 {story.views ? (story.views / 1000).toFixed(0) + 'K' : '—'}
            </div>
          </div>
        </div>

        {/* Caption preview */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
          {shareText}
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button onClick={shareFb}
            style={{ flex: 1, background: '#1877f2', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button onClick={shareTikTok}
            style={{ flex: 1, background: '#010101', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
            TikTok
          </button>
        </div>

        {/* Copy link */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input readOnly value={shareUrl}
            style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#374151', background: '#f8fafc', outline: 'none' }} />
          <button onClick={copy}
            style={{ background: copied ? '#16a34a' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', transition: 'background 0.2s' }}>
            {copied ? '✓ Đã copy' : 'Copy'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
          💡 Chia sẻ chương miễn phí → kéo người đọc → mua xu đọc tiếp
        </p>
      </div>
    </div>
  )
}
