// src/pages/StoryPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStory, getChapters, incrementView } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import ShareModal from '../components/ShareModal'

const MOCK_STORY = {
  id: '1', title: 'Vùng Đất Hứa',
  coverUrl: 'https://picsum.photos/seed/s1/300/420',
  team: 'Yên Khôi', genres: ['Tình cảm','Drama'],
  views: 128400, rating: 4.8, status: 'Đang tiến hành',
  updatedAt: { toDate: () => new Date(Date.now() - 15*3600*1000) },
  description: 'Năm thứ bảy sau khi ly hôn, tôi về nước. Vì công việc, tôi đến một trang viên tư nhân để săn ảnh. Vô tình, một cô bé lọt vào ống kính của tôi. Khoảnh khắc bấm máy, hiện lên trong khung hình là một khuôn mặt có đến tám phần giống tôi. Trái tim tôi chấn động kịch liệt, bàn tay cầm máy ảnh bất giác run lên. "Tiểu thư." Vệ sĩ phía sau cô bé bước tới...',
}

const MOCK_CHAPTERS = [
  { id:'c1', title:'Chương 1: Trở về',      order:1, locked:false, coinCost:0, thumbnail:'https://picsum.photos/seed/c1t/80/80', updatedAt:{toDate:()=>new Date(Date.now()-1*86400000)}, readTime:5 },
  { id:'c2', title:'Chương 2: Cuộc gặp gỡ', order:2, locked:false, coinCost:0, thumbnail:'https://picsum.photos/seed/c2t/80/80', updatedAt:{toDate:()=>new Date(Date.now()-2*86400000)}, readTime:6 },
  { id:'c3', title:'Chương 3: Bí mật',       order:3, locked:true,  coinCost:5, thumbnail:'https://picsum.photos/seed/c3t/80/80', updatedAt:{toDate:()=>new Date(Date.now()-3*86400000)}, readTime:7 },
  { id:'c4', title:'Chương 4: Sự thật',      order:4, locked:true,  coinCost:5, thumbnail:'https://picsum.photos/seed/c4t/80/80', updatedAt:{toDate:()=>new Date(Date.now()-5*86400000)}, readTime:8 },
  { id:'c5', title:'Chương 5: Hành trình',   order:5, locked:true,  coinCost:8, thumbnail:'https://picsum.photos/seed/c5t/80/80', updatedAt:{toDate:()=>new Date(Date.now()-7*86400000)}, readTime:9 },
]

const RELATED = [
  { id:'2', title:'Kiếm Thần Vô Song',  coverUrl:'https://picsum.photos/seed/s2/120/160', genres:['Hành động'] },
  { id:'3', title:'Cô Nàng Nổi Loạn',  coverUrl:'https://picsum.photos/seed/s3/120/160', genres:['Học đường'] },
  { id:'4', title:'Bóng Tối Thành Phố', coverUrl:'https://picsum.photos/seed/s4/120/160', genres:['Trinh thám'] },
  { id:'5', title:'Mối Tình Đầu',       coverUrl:'https://picsum.photos/seed/s5/120/160', genres:['Tình cảm']  },
  { id:'6', title:'Thiên Tài Tái Sinh', coverUrl:'https://picsum.photos/seed/s6/120/160', genres:['Tiên hiệp'] },
]

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 3600)  return `${Math.floor(s/60)} phút trước`
  if (s < 86400) return `${Math.floor(s/3600)} giờ trước`
  return `${Math.floor(s/86400)} ngày trước`
}

function ChapterThumbs({ chapters, storyId }) {
  const [start, setStart] = useState(0)
  const visible = 5
  const shown = chapters.slice(start, start + visible)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14 }}>
      <div style={{ display:'flex', gap:8, flex:1 }}>
        {shown.map(ch => (
          <Link key={ch.id} to={`/truyen/${storyId}/chuong/${ch.id}`} style={{ textDecoration:'none', flexShrink:0 }}>
            <div style={{ position:'relative', width:52, height:52 }}>
              <img src={ch.thumbnail || `https://picsum.photos/seed/${ch.id}/80/80`} alt={ch.title}
                style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'2px solid #e2e8f0', display:'block' }} />
              {ch.locked && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔒</div>
              )}
            </div>
          </Link>
        ))}
      </div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        <button onClick={() => setStart(s => Math.max(0, s-visible))} disabled={start===0}
          style={{ width:28, height:28, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:start===0?'default':'pointer', fontSize:14, opacity:start===0?0.4:1 }}>‹</button>
        <button onClick={() => setStart(s => Math.min(chapters.length-visible, s+visible))} disabled={start+visible>=chapters.length}
          style={{ width:28, height:28, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:start+visible>=chapters.length?'default':'pointer', fontSize:14, opacity:start+visible>=chapters.length?0.4:1 }}>›</button>
      </div>
    </div>
  )
}

export default function StoryPage({ auth, onLoginRequest, onCoinModal }) {
  const { storyId } = useParams()
  const [story, setStory]    = useState(null)
  const [chapters, setChaps] = useState(MOCK_CHAPTERS)
  const [shareOpen, setShare]= useState(false)
  const [tab, setTab]        = useState('chapters')

  useEffect(() => {
    getStory(storyId).then(s => { if (s) setStory(s) })
    getChapters(storyId).then(cs => { if (cs.length) setChaps(cs) })
    incrementView(storyId).catch(() => {})
  }, [storyId])

  const s = story || { ...MOCK_STORY, id: storyId }
  const totalReadTime = chapters.reduce((acc,c) => acc + (c.readTime||5), 0)
  const lastUpdated   = chapters[0]?.updatedAt

  return (
    <div>
      <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#6b7280', fontSize:13, textDecoration:'none', marginBottom:16 }}>
        ← Trang chủ
      </Link>

      {/* ── Hero card ── */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', padding:20, marginBottom:20, display:'flex', gap:20, flexWrap:'wrap' }}>
        {/* Cover */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <img src={s.coverUrl} alt={s.title}
            style={{ width:140, height:196, borderRadius:12, objectFit:'cover', display:'block', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }} />
          <span style={{ position:'absolute', top:8, left:8, background: s.status==='Hoàn thành'?'#16a34a':'#6366f1', color:'#fff', fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:700 }}>
            {s.status || 'Đang TH'}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:180 }}>
          <h1 style={{ margin:'0 0 10px', fontSize:22, fontWeight:800, lineHeight:1.2, color:'#1e293b' }}>{s.title}</h1>

          {/* Meta badges — giống screenshot */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#374151' }}>
              👥 Team: {s.team}
            </span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fef3c7', border:'1px solid #fde68a', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#92400e' }}>
              🗓 {timeAgo(lastUpdated)}
            </span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#166534' }}>
              ⏱ ~{totalReadTime} phút đọc
            </span>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:16, fontSize:13, color:'#6b7280', marginBottom:12 }}>
            <span>⭐ {s.rating||'4.8'}</span>
            <span>👁 {s.views?(s.views/1000).toFixed(0)+'K':'128K'} lượt đọc</span>
            <span>📖 {chapters.length} chương</span>
          </div>

          {/* Genres */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {(s.genres||[]).map(g => (
              <span key={g} style={{ background:'#ede9fe', color:'#6d28d9', fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700 }}>{g}</span>
            ))}
          </div>

          {/* Description */}
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#374151', lineHeight:1.7, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {s.description}
          </p>

          {/* Buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
            <Link to={`/truyen/${storyId}/chuong/${chapters[0]?.id||'c1'}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#6366f1', color:'#fff', borderRadius:10, padding:'10px 22px', fontWeight:800, fontSize:13, textDecoration:'none' }}>
              ▶ Đọc ngay
            </Link>
            <button onClick={() => document.getElementById('chapter-list')?.scrollIntoView({behavior:'smooth'})}
              style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 18px', cursor:'pointer', fontWeight:700, fontSize:13, color:'#374151' }}>
              📋 Danh sách chương
            </button>
            <button onClick={() => setShare(true)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 14px', cursor:'pointer', fontWeight:700, fontSize:16 }}>
              🔗
            </button>
          </div>

          {/* Chapter thumbnails */}
          <ChapterThumbs chapters={chapters} storyId={storyId} />
        </div>
      </div>

      <AdBanner slot="top" />

      {/* ── Chapter list với tabs ── */}
      <div id="chapter-list" style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:20 }}>
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0' }}>
          {[['chapters',`📖 Danh sách chương (${chapters.length})`],['info','ℹ️ Thông tin']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex:1, padding:'14px', border:'none', background:'none', cursor:'pointer', fontWeight:700, fontSize:13, color:tab===key?'#6366f1':'#6b7280', borderBottom:tab===key?'2px solid #6366f1':'2px solid transparent', marginBottom:-1, transition:'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'chapters' && (
          <div>
            {chapters.map((ch, i) => {
              const isLocked = ch.locked && !ch.unlocked
              return (
                <Link key={ch.id} to={`/truyen/${storyId}/chuong/${ch.id}`}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', textDecoration:'none', color:'inherit', borderBottom:i<chapters.length-1?'1px solid #f1f5f9':'none', transition:'background 0.1s' }}
                  onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}>

                  {/* Thumbnail */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={ch.thumbnail||`https://picsum.photos/seed/${ch.id}/80/80`} alt=""
                      style={{ width:48, height:48, borderRadius:8, objectFit:'cover', display:'block', border:'1px solid #e2e8f0' }} />
                    {isLocked && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🔒</div>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ch.title}</div>
                    <div style={{ display:'flex', gap:10, fontSize:11, color:'#9ca3af' }}>
                      <span>🗓 {timeAgo(ch.updatedAt)}</span>
                      {ch.readTime && <span>⏱ {ch.readTime} phút</span>}
                    </div>
                  </div>

                  {/* Badge */}
                  {isLocked ? (
                    <span style={{ flexShrink:0, background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, border:'1px solid #fde68a' }}>
                      🔒 {ch.coinCost} xu
                    </span>
                  ) : (
                    <span style={{ flexShrink:0, background:'#f0fdf4', color:'#166534', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, border:'1px solid #bbf7d0' }}>
                      Miễn phí
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {tab === 'info' && (
          <div style={{ padding:20 }}>
            <p style={{ margin:'0 0 16px', fontSize:14, color:'#374151', lineHeight:1.8 }}>{s.description}</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              {[
                ['Tác giả / Team', s.team],
                ['Thể loại', (s.genres||[]).join(', ')],
                ['Trạng thái', s.status||'Đang tiến hành'],
                ['Số chương', chapters.length],
                ['Lượt xem', s.views?s.views.toLocaleString('vi-VN'):'128,400'],
                ['Đánh giá', `⭐ ${s.rating||4.8} / 5`],
              ].map(([k,v]) => (
                <tr key={k} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'10px 0', color:'#6b7280', fontWeight:600, width:140 }}>{k}</td>
                  <td style={{ padding:'10px 0', color:'#1e293b', fontWeight:500 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
        )}
      </div>

      {/* ── Truyện liên quan ── */}
      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>📚 Truyện liên quan</h3>
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
          {RELATED.filter(r => r.id !== storyId).map(r => (
            <Link key={r.id} to={`/truyen/${r.id}`} style={{ textDecoration:'none', flexShrink:0, width:100 }}>
              <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', background:'#fff' }}
                onMouseOver={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                <img src={r.coverUrl} alt={r.title} style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }} />
                <div style={{ padding:'8px 8px 10px' }}>
                  <div style={{ fontWeight:700, fontSize:12, lineHeight:1.3, color:'#1e293b', marginBottom:4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{r.title}</div>
                  {r.genres?.[0] && <span style={{ fontSize:10, background:'#ede9fe', color:'#6d28d9', padding:'2px 6px', borderRadius:8, fontWeight:700 }}>{r.genres[0]}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {shareOpen && <ShareModal story={s} chapter={null} onClose={() => setShare(false)} />}
    </div>
  )
}
