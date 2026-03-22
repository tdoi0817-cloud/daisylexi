// src/pages/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getStories } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import ShareModal from '../components/ShareModal'

const GENRES = ['Tất cả','Tình cảm','Hành động','Tiên hiệp','Học đường','Trinh thám','Hài hước','Kinh dị','Cổ đại']

const MOCK = [
  { id:'1', title:'Vùng Đất Hứa',           coverUrl:'https://picsum.photos/seed/s1/300/420',  team:'Yên Khôi',      genres:['Tình cảm','Drama'],     views:128400, rating:4.8, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-15*3600000)}, description:'Năm thứ bảy sau khi ly hôn, tôi về nước. Vô tình, một cô bé lọt vào ống kính của tôi. Khoảnh khắc bấm máy, hiện lên trong khung hình là một khuôn mặt có đến tám phần giống tôi...' },
  { id:'2', title:'Cách Trả Ơn Chuẩn Không Cần Chỉnh', coverUrl:'https://picsum.photos/seed/s2/300/420', team:'Chụt Một Cái', genres:['Cổ đại','Hài hước'],   views:95200,  rating:4.6, isNew:true,  isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-1*86400000)},  description:'Ta cứu được một nam nhân bị thương nặng. Sau khi tỉnh lại, hắn liền nói: "Đa tạ ơn cứu mạng của cô nương, chỉ tiếc tại hạ đã có thê tử..." Ô hay, sao kịch bản lại không giống y như trong sách truyện thường viết thế?' },
  { id:'3', title:'Kiếm Thần Vô Song',       coverUrl:'https://picsum.photos/seed/s3/300/420',  team:'Dragon Team',   genres:['Hành động','Tiên hiệp'], views:76800,  rating:4.5, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-2*86400000)},  description:'Thiên tài kiếm thuật bị phản bội, tái sinh với sức mạnh vô song...' },
  { id:'4', title:'Bóng Tối Thành Phố',      coverUrl:'https://picsum.photos/seed/s4/300/420',  team:'Shadow Ink',    genres:['Trinh thám','Bí ẩn'],    views:61300,  rating:4.7, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-3*86400000)},  description:'Thám tử tư trẻ tuổi điều tra vụ mất tích hàng loạt...' },
  { id:'5', title:'Cô Nàng Nổi Loạn',        coverUrl:'https://picsum.photos/seed/s5/300/420',  team:'Pink Studio',   genres:['Học đường','Hài hước'],  views:54000,  rating:4.4, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-4*86400000)},  description:'Học sinh cá biệt số một trường chạm mặt thầy giáo mới cực kỳ nghiêm túc...' },
  { id:'6', title:'Mối Tình Đầu',             coverUrl:'https://picsum.photos/seed/s6/300/420',  team:'Sweet Studio',  genres:['Tình cảm','Học đường'], views:48200,  rating:4.6, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-5*86400000)},  description:'Câu chuyện tình yêu trong sáng thời học sinh...' },
  { id:'7', title:'Thiên Tài Tái Sinh',       coverUrl:'https://picsum.photos/seed/s7/300/420',  team:'Nova Team',     genres:['Tiên hiệp','Hành động'],views:42100,  rating:4.3, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-6*86400000)},  description:'Sau khi chết đi, thiên tài trẻ tái sinh vào thế giới tu tiên...' },
  { id:'8', title:'Nữ Hoàng Trở Lại',         coverUrl:'https://picsum.photos/seed/s8/300/420',  team:'Queen Studio',  genres:['Cổ đại','Drama'],       views:38500,  rating:4.5, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-7*86400000)},  description:'Nữ hoàng bị phản bội, xuyên không trở lại thời điểm trước...' },
]

const MOCK_CHAPTERS_HERO = [
  { id:'c1', thumbnail:'https://picsum.photos/seed/h1t/80/80' },
  { id:'c2', thumbnail:'https://picsum.photos/seed/h2t/80/80' },
  { id:'c3', thumbnail:'https://picsum.photos/seed/h3t/80/80' },
  { id:'c4', thumbnail:'https://picsum.photos/seed/h4t/80/80' },
  { id:'c5', thumbnail:'https://picsum.photos/seed/h5t/80/80' },
]

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 3600)  return `${Math.floor(s/60)} phút trước`
  if (s < 86400) return `${Math.floor(s/3600)} giờ trước`
  return `${Math.floor(s/86400)} ngày trước`
}

// ── Hero banner (giống screenshot: ảnh lớn trái, info phải) ──
function HeroBanner({ story, onShare }) {
  const [thumbStart, setThumbStart] = useState(0)
  const visible = 5
  const thumbs = MOCK_CHAPTERS_HERO

  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eaf0', padding:'28px 28px 24px', marginBottom:24, display:'flex', gap:28, alignItems:'flex-start', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Cover — phone-frame style như screenshot */}
      <div style={{ flexShrink:0, position:'relative' }}>
        <div style={{ width:220, height:300, borderRadius:16, overflow:'hidden', boxShadow:'0 8px 28px rgba(0,0,0,0.14)', position:'relative', background:'#f1f5f9' }}>
          <img src={story.coverUrl} alt={story.title}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          {/* Watermark giống meokammap.com */}
          <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(255,255,255,0.75)', borderRadius:6, padding:'2px 8px', fontSize:10, color:'#374151', fontWeight:600 }}>
            meokammap.com
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
        <h2 style={{ margin:'0 0 14px', fontSize:24, fontWeight:800, color:'#1e293b', lineHeight:1.25 }}>{story.title}</h2>

        <p style={{ margin:'0 0 18px', fontSize:14, color:'#374151', lineHeight:1.75, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {story.description}
        </p>

        {/* Meta badges — giống screenshot */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:18 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:600, color:'#374151' }}>
            👥 Team: {story.team}
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fef9ec', border:'1px solid #fde68a', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:600, color:'#92400e' }}>
            🗓 {timeAgo(story.updatedAt)}
          </span>
        </div>

        {/* Buttons — giống screenshot */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <Link to={`/truyen/${story.id}`}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid #d1d5db', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:14, textDecoration:'none', color:'#1e293b' }}>
            Đọc ngay
          </Link>
          <Link to={`/truyen/${story.id}`}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid #d1d5db', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:14, textDecoration:'none', color:'#1e293b' }}>
            Danh sách chương
          </Link>
        </div>

        {/* Chapter thumbnails + prev/next */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:8 }}>
            {thumbs.slice(thumbStart, thumbStart + visible).map((ch, i) => (
              <Link key={ch.id} to={`/truyen/${story.id}/chuong/${ch.id}`} style={{ textDecoration:'none' }}>
                <img src={ch.thumbnail} alt=""
                  style={{ width:52, height:52, borderRadius:10, objectFit:'cover', border: i === 0 ? '2.5px solid #6366f1' : '2px solid #e2e8f0', display:'block', transition:'border-color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor='#6366f1'}
                  onMouseOut={e => { if(i!==0) e.currentTarget.style.borderColor='#e2e8f0' }} />
              </Link>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
            <button onClick={() => setThumbStart(s => Math.max(0, s-1))} disabled={thumbStart===0}
              style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:thumbStart===0?'default':'pointer', fontSize:15, fontWeight:700, opacity:thumbStart===0?0.4:1, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <button onClick={() => setThumbStart(s => Math.min(thumbs.length-visible, s+1))} disabled={thumbStart+visible>=thumbs.length}
              style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:thumbStart+visible>=thumbs.length?'default':'pointer', fontSize:15, fontWeight:700, opacity:thumbStart+visible>=thumbs.length?0.4:1, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Story card (grid item) ──
function StoryCard({ story }) {
  return (
    <Link to={`/truyen/${story.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ borderRadius:12, overflow:'hidden', background:'#fff', border:'1px solid #e8eaf0', transition:'transform 0.15s, box-shadow 0.15s', position:'relative' }}
        onMouseOver={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(0,0,0,0.12)' }}
        onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>

        {/* Cover */}
        <div style={{ position:'relative', aspectRatio:'3/4', overflow:'hidden' }}>
          <img src={story.coverUrl} alt={story.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />

          {/* Badges top-left */}
          <div style={{ position:'absolute', top:8, left:8, display:'flex', gap:4 }}>
            {story.isNew && (
              <span style={{ background:'#ef4444', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:6 }}>MỚI</span>
            )}
          </div>

          {/* FULL badge top-right */}
          {story.isFull && (
            <span style={{ position:'absolute', top:8, right:8, background:'#16a34a', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:6 }}>FULL</span>
          )}

          {/* Dark gradient bottom */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:70, background:'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }} />
          <div style={{ position:'absolute', bottom:8, left:8, right:8 }}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:13, lineHeight:1.3, textShadow:'0 1px 3px rgba(0,0,0,0.5)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {story.title}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'8px 10px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'#6b7280' }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontWeight:600 }}>
              👥 {story.team}
            </span>
            <span>⭐ {story.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Ranking widget ──
function RankingWidget({ stories }) {
  const [rankTab, setRankTab] = useState('day')
  const tabs = [['day','Ngày'],['week','Tuần'],['month','Tháng'],['year','Năm']]

  // Mock sort differently per tab
  const ranked = [...stories].sort((a,b) => {
    if (rankTab==='day')   return b.views*0.3 - a.views*0.3
    if (rankTab==='week')  return b.rating - a.rating
    if (rankTab==='month') return b.views - a.views
    return b.views*b.rating - a.views*a.rating
  }).slice(0,10)

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🏆</span>
          <span style={{ fontWeight:800, fontSize:15, color:'#1e293b' }}>Bảng xếp hạng</span>
        </div>
        <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>Top 10</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', padding:'0 12px 10px', gap:4 }}>
        {tabs.map(([key,label]) => (
          <button key={key} onClick={() => setRankTab(key)}
            style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:rankTab===key?'#6366f1':'#f1f5f9', color:rankTab===key?'#fff':'#6b7280', transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        {ranked.map((s, i) => (
          <Link key={s.id} to={`/truyen/${s.id}`}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', textDecoration:'none', color:'inherit', borderTop:'1px solid #f8fafc', transition:'background 0.1s' }}
            onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
            onMouseOut={e => e.currentTarget.style.background='transparent'}>

            {/* Rank number */}
            <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800,
              background: i===0?'#f59e0b': i===1?'#9ca3af': i===2?'#cd7c2e':'#f1f5f9',
              color: i<3?'#fff':'#6b7280' }}>
              {i+1}
            </div>

            {/* Cover */}
            <img src={s.coverUrl} alt={s.title} style={{ width:40, height:56, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid #e2e8f0' }} />

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#1e293b' }}>{s.title}</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>👁 {(s.views/1000).toFixed(0)}K · ⭐ {s.rating}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function HomePage({ auth, onLoginRequest }) {
  const [stories, setStories]  = useState(MOCK)
  const [genre, setGenre]      = useState('Tất cả')
  const [shareStory, setShare] = useState(null)
  const [heroIdx, setHeroIdx]  = useState(0)
  const [searchParams]         = useSearchParams()
  const search                 = searchParams.get('search') || ''

  useEffect(() => {
    getStories({ genre: genre==='Tất cả'?null:genre })
      .then(data => { if (data.length) setStories(data) })
      .catch(()=>{})
  }, [genre])

  // Auto-rotate hero every 6s
  useEffect(() => {
    if (search) return
    const t = setInterval(() => setHeroIdx(i => (i+1) % Math.min(3, MOCK.length)), 6000)
    return () => clearInterval(t)
  }, [search])

  const filtered = search
    ? stories.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : stories

  const heroStory = filtered[heroIdx] || filtered[0]

  return (
    <div>
      {/* ── Hero banner ── */}
      {!search && heroStory && (
        <>
          <HeroBanner story={heroStory} onShare={setShare} />
          {/* Hero dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:-16, marginBottom:24 }}>
            {filtered.slice(0,3).map((_,i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                style={{ width: i===heroIdx?20:8, height:8, borderRadius:99, border:'none', background:i===heroIdx?'#6366f1':'#d1d5db', cursor:'pointer', transition:'all 0.3s', padding:0 }} />
            ))}
          </div>
        </>
      )}

      {/* ── Genre pills ── */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10, marginBottom:20 }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{ padding:'6px 16px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.15s',
              background: genre===g?'#6366f1':'#fff',
              color:       genre===g?'#fff':'#6b7280',
              borderColor: genre===g?'#6366f1':'#e2e8f0' }}>
            {g}
          </button>
        ))}
      </div>

      {/* ── Main 2-column layout ── */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* Left: story grid */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Section header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:20 }}>🔥</span>
            <div>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#1e293b' }}>
                {search ? `Kết quả: "${search}"` : 'Mới cập nhật'}
              </h3>
              {!search && <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>Những truyện vừa có chương mới.</p>}
            </div>
          </div>

          {filtered.length === 0
            ? <p style={{ textAlign:'center', color:'#9ca3af', padding:'30px 0' }}>Không tìm thấy truyện nào.</p>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14 }}>
                {filtered.map(s => <StoryCard key={s.id} story={s} />)}
              </div>
            )
          }
        </div>

        {/* Right: ranking */}
        <div style={{ width:260, flexShrink:0 }}>
          <RankingWidget stories={stories} />
        </div>
      </div>

      <div style={{ marginTop:20 }}>
        <AdBanner slot="top" />
      </div>

      {shareStory && <ShareModal story={shareStory} chapter={null} onClose={() => setShare(null)} />}
    </div>
  )
}
