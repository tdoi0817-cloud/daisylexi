// src/pages/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getStories } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import ShareModal from '../components/ShareModal'

const GENRES = ['Tất cả', 'Tình cảm', 'Hành động', 'Tiên hiệp', 'Học đường', 'Trinh thám', 'Hài hước', 'Kinh dị']

// Fallback mock khi chưa có Firestore data
const MOCK = [
  { id: '1', title: 'Vùng Đất Hứa',      coverUrl: 'https://picsum.photos/seed/s1/300/420', team: 'Yên Khôi',    genres: ['Tình cảm','Drama'],    views: 128400, rating: 4.8 },
  { id: '2', title: 'Kiếm Thần Vô Song',  coverUrl: 'https://picsum.photos/seed/s2/300/420', team: 'Dragon Team', genres: ['Hành động','Tiên hiệp'], views: 95200,  rating: 4.6 },
  { id: '3', title: 'Cô Nàng Nổi Loạn',  coverUrl: 'https://picsum.photos/seed/s3/300/420', team: 'Pink Studio', genres: ['Học đường','Hài hước'],   views: 76800,  rating: 4.5 },
  { id: '4', title: 'Bóng Tối Thành Phố', coverUrl: 'https://picsum.photos/seed/s4/300/420', team: 'Shadow Ink',  genres: ['Trinh thám','Bí ẩn'],    views: 61300,  rating: 4.7 },
  { id: '5', title: 'Thiên Tài Tái Sinh',  coverUrl: 'https://picsum.photos/seed/s5/300/420', team: 'Nova Team',   genres: ['Tiên hiệp','Hành động'], views: 54000,  rating: 4.4 },
  { id: '6', title: 'Mối Tình Đầu',        coverUrl: 'https://picsum.photos/seed/s6/300/420', team: 'Sweet Studio',genres: ['Tình cảm','Học đường'],  views: 48200,  rating: 4.6 },
]

export default function HomePage({ auth, onLoginRequest }) {
  const [stories, setStories]   = useState(MOCK)
  const [genre, setGenre]       = useState('Tất cả')
  const [shareStory, setShare]  = useState(null)
  const [searchParams]          = useSearchParams()
  const search                  = searchParams.get('search') || ''

  useEffect(() => {
    getStories({ genre: genre === 'Tất cả' ? null : genre })
      .then(data => { if (data.length) setStories(data) })
      .catch(() => {}) // fallback to mock
  }, [genre])

  const filtered = search
    ? stories.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : stories

  const featured = filtered[0]

  return (
    <div>
      {/* Hero */}
      {featured && !search && (
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)', borderRadius: 16, padding: 22, marginBottom: 22, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={featured.coverUrl} alt={featured.title}
            style={{ width: 110, height: 154, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, padding: '2px 10px', borderRadius: 12, fontWeight: 800 }}>HOT ⚡</span>
            <h2 style={{ color: '#fff', margin: '8px 0', fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{featured.title}</h2>
            <p style={{ color: '#c7d2fe', fontSize: 12, margin: '0 0 14px', lineHeight: 1.5 }}>Team: {featured.team}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/truyen/${featured.id}`}
                style={{ background: '#6366f1', color: '#fff', borderRadius: 10, padding: '9px 20px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                Đọc ngay
              </Link>
              <button onClick={() => setShare(featured)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                🔗 Chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}

      <AdBanner slot="top" />

      {/* Genre filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', background: genre === g ? '#6366f1' : '#f1f5f9', color: genre === g ? '#fff' : '#6b7280', transition: 'all 0.15s' }}>
            {g}
          </button>
        ))}
      </div>

      {/* Title */}
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>
        {search ? `🔍 Kết quả: "${search}"` : '🔥 Mới cập nhật'}
      </h3>

      {/* Story grid */}
      {filtered.length === 0
        ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px 0' }}>Không tìm thấy truyện nào.</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            {filtered.map(s => (
              <Link key={s.id} to={`/truyen/${s.id}`} style={{ textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'block', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ position: 'relative' }}>
                  <img src={s.coverUrl} alt={s.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>
                    👁 {(s.views / 1000).toFixed(0)}K
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3, color: '#1e293b' }}>{s.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>⭐ {s.rating}</span>
                    {s.genres?.[0] && <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '1px 7px', borderRadius: 8 }}>{s.genres[0]}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      }

      {/* Ranking sidebar widget */}
      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800 }}>🏆 Bảng xếp hạng</h4>
        {MOCK.slice(0, 5).map((s, i) => (
          <Link key={s.id} to={`/truyen/${s.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: i < 3 ? ['#f59e0b','#9ca3af','#cd7c2e'][i] : '#f1f5f9', color: i < 3 ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {i + 1}
            </span>
            <img src={s.coverUrl} alt="" style={{ width: 36, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>👁 {(s.views / 1000).toFixed(0)}K · ⭐ {s.rating}</div>
            </div>
          </Link>
        ))}
      </div>

      {shareStory && <ShareModal story={shareStory} chapter={null} onClose={() => setShare(null)} />}
    </div>
  )
}
