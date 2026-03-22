// src/pages/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getStories } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import ShareModal from '../components/ShareModal'

const GENRES = ['Tất cả','Tình cảm','Hành động','Tiên hiệp','Học đường','Trinh thám','Hài hước','Cổ đại']

const MOCK = [
  { id:'1', title:'Vùng Đất Hứa',                      coverUrl:'https://picsum.photos/seed/s1/300/420', team:'Yên Khôi',      genres:['Tình cảm'],   views:128400, rating:4.8, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-15*3600000)}, description:'Năm thứ bảy sau khi ly hôn, tôi về nước. Vô tình, một cô bé lọt vào ống kính của tôi. Khuôn mặt trong khung hình có đến tám phần giống tôi...' },
  { id:'2', title:'Cách Trả Ơn Chuẩn Không Cần Chỉnh', coverUrl:'https://picsum.photos/seed/s2/300/420', team:'Chụt Một Cái',  genres:['Cổ đại'],    views:95200,  rating:4.6, isNew:true,  isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-1*86400000)},  description:'Ta cứu được một nam nhân bị thương nặng. Sau khi tỉnh lại, hắn nói: "Đa tạ ơn cứu mạng..."' },
  { id:'3', title:'Kiếm Thần Vô Song',                  coverUrl:'https://picsum.photos/seed/s3/300/420', team:'Dragon Team',   genres:['Hành động'],  views:76800,  rating:4.5, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-2*86400000)},  description:'Thiên tài kiếm thuật bị phản bội, tái sinh với sức mạnh vô song...' },
  { id:'4', title:'Bóng Tối Thành Phố',                 coverUrl:'https://picsum.photos/seed/s4/300/420', team:'Shadow Ink',    genres:['Trinh thám'], views:61300,  rating:4.7, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-3*86400000)},  description:'Thám tử tư trẻ tuổi điều tra vụ mất tích hàng loạt...' },
  { id:'5', title:'Cô Nàng Nổi Loạn',                   coverUrl:'https://picsum.photos/seed/s5/300/420', team:'Pink Studio',   genres:['Học đường'],  views:54000,  rating:4.4, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-4*86400000)},  description:'Học sinh cá biệt số một trường chạm mặt thầy giáo mới nghiêm túc...' },
  { id:'6', title:'Mối Tình Đầu',                       coverUrl:'https://picsum.photos/seed/s6/300/420', team:'Sweet Studio',  genres:['Tình cảm'],   views:48200,  rating:4.6, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-5*86400000)},  description:'Câu chuyện tình yêu trong sáng thời học sinh...' },
  { id:'7', title:'Thiên Tài Tái Sinh',                 coverUrl:'https://picsum.photos/seed/s7/300/420', team:'Nova Team',     genres:['Tiên hiệp'],  views:42100,  rating:4.3, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-6*86400000)},  description:'Sau khi chết đi, thiên tài trẻ tái sinh vào thế giới tu tiên...' },
  { id:'8', title:'Nữ Hoàng Trở Lại',                   coverUrl:'https://picsum.photos/seed/s8/300/420', team:'Queen Studio',  genres:['Cổ đại'],    views:38500,  rating:4.5, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-7*86400000)},  description:'Nữ hoàng bị phản bội, xuyên không trở lại thời điểm trước...' },
  { id:'9', title:'Hắc Long Giáo',                      coverUrl:'https://picsum.photos/seed/s9/300/420', team:'Dark Team',     genres:['Hành động'],  views:31200,  rating:4.2, isNew:true,  isFull:false, updatedAt:{toDate:()=>new Date(Date.now()-8*86400000)},  description:'Một tổ chức bí ẩn nắm giữ bí mật của thế giới...' },
  { id:'10',title:'Tiểu Thư Nhà Tôi',                   coverUrl:'https://picsum.photos/seed/s10/300/420',team:'Lovely Team',   genres:['Tình cảm'],   views:28700,  rating:4.4, isNew:false, isFull:true,  updatedAt:{toDate:()=>new Date(Date.now()-9*86400000)},  description:'Câu chuyện dễ thương về cô tiểu thư và anh chàng bên cạnh...' },
]

const HERO_THUMBS = Array.from({length:5}, (_,i) => ({
  id:`ht${i+1}`, thumbnail:`https://picsum.photos/seed/ht${i+1}/80/80`
}))

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 3600)  return `${Math.floor(s/60)} phút trước`
  if (s < 86400) return `${Math.floor(s/3600)} giờ trước`
  return `${Math.floor(s/86400)} ngày trước`
}

// ── Hero Banner ──────────────────────────────────────────────────
function HeroBanner({ story }) {
  const [tStart, setTStart] = useState(0)
  const vis = 5

  return (
    <div className="hero-card" style={{
      background:'#fff', borderRadius:14, border:'1px solid #e8eaf0',
      padding:'20px', marginBottom:16,
      display:'flex', gap:18, alignItems:'flex-start',
      boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
    }}>
      {/* Cover */}
      <div className="hero-cover" style={{ flexShrink:0, position:'relative', width:200, height:280, borderRadius:14, overflow:'hidden', boxShadow:'0 6px 20px rgba(0,0,0,0.15)' }}>
        <img src={story.coverUrl} alt={story.title}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(255,255,255,0.82)', borderRadius:6, padding:'2px 8px', fontSize:10, color:'#374151', fontWeight:600 }}>
          daisylexi.com
        </div>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <h2 className="hero-title" style={{ margin:'0 0 10px', fontSize:22, fontWeight:800, color:'#1e293b', lineHeight:1.3, wordBreak:'keep-all' }}>
          {story.title}
        </h2>

        <p className="hero-desc" style={{ margin:'0 0 14px', fontSize:13, color:'#4b5563', lineHeight:1.7, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {story.description}
        </p>

        {/* Badges */}
        <div className="meta-badges" style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          <span className="meta-badge" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, padding:'5px 12px', fontSize:12, fontWeight:600, color:'#374151' }}>
            👥 Team: {story.team}
          </span>
          <span className="meta-badge" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fef9ec', border:'1px solid #fde68a', borderRadius:10, padding:'5px 12px', fontSize:12, fontWeight:600, color:'#92400e' }}>
            🗓 {timeAgo(story.updatedAt)}
          </span>
        </div>

        {/* Buttons */}
        <div className="hero-buttons" style={{ display:'flex', gap:8, marginBottom:14 }}>
          <Link to={`/truyen/${story.id}`}
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5, background:'#fff', border:'1.5px solid #d1d5db', borderRadius:10, padding:'9px 18px', fontWeight:700, fontSize:13, textDecoration:'none', color:'#1e293b', whiteSpace:'nowrap' }}>
            Đọc ngay
          </Link>
          <Link to={`/truyen/${story.id}`}
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5, background:'#fff', border:'1.5px solid #d1d5db', borderRadius:10, padding:'9px 18px', fontWeight:700, fontSize:13, textDecoration:'none', color:'#1e293b', whiteSpace:'nowrap' }}>
            Danh sách chương
          </Link>
        </div>

        {/* Thumbnails */}
        <div className="chapter-thumbs" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:6, flex:1, overflow:'hidden' }}>
            {HERO_THUMBS.slice(tStart, tStart + vis).map((t, i) => (
              <Link key={t.id} to={`/truyen/${story.id}/chuong/${t.id}`} style={{ textDecoration:'none', flexShrink:0 }}>
                <img className="chapter-thumb" src={t.thumbnail} alt=""
                  style={{ width:50, height:50, borderRadius:8, objectFit:'cover', border: i===0?'2.5px solid #6366f1':'2px solid #e2e8f0', display:'block' }} />
              </Link>
            ))}
          </div>
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            <button onClick={() => setTStart(s => Math.max(0,s-1))} disabled={tStart===0}
              style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', opacity:tStart===0?0.35:1, cursor:tStart===0?'default':'pointer' }}>‹</button>
            <button onClick={() => setTStart(s => Math.min(HERO_THUMBS.length-vis,s+1))} disabled={tStart+vis>=HERO_THUMBS.length}
              style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', opacity:tStart+vis>=HERO_THUMBS.length?0.35:1, cursor:tStart+vis>=HERO_THUMBS.length?'default':'pointer' }}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Story Card ───────────────────────────────────────────────────
function StoryCard({ story }) {
  return (
    <Link to={`/truyen/${story.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ borderRadius:10, overflow:'hidden', background:'#fff', border:'1px solid #e8eaf0', transition:'transform 0.15s, box-shadow 0.15s' }}
        onMouseOver={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(0,0,0,0.11)' }}
        onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
        <div style={{ position:'relative', aspectRatio:'3/4', overflow:'hidden' }}>
          <img src={story.coverUrl} alt={story.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          {/* Badges */}
          <div style={{ position:'absolute', top:6, left:6, display:'flex', flexDirection:'column', gap:3 }}>
            {story.isNew  && <span style={{ background:'#ef4444', color:'#fff', fontSize:9,  fontWeight:800, padding:'2px 6px', borderRadius:5 }}>MỚI</span>}
          </div>
          {story.isFull && <span style={{ position:'absolute', top:6, right:6, background:'#16a34a', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:5 }}>FULL</span>}
          {/* Gradient + title */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:65, background:'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          <div style={{ position:'absolute', bottom:6, left:6, right:6, color:'#fff', fontWeight:700, fontSize:11, lineHeight:1.3, textShadow:'0 1px 3px rgba(0,0,0,0.6)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {story.title}
          </div>
        </div>
        <div style={{ padding:'6px 8px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, color:'#6b7280', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>👥 {story.team}</span>
          <span style={{ fontSize:10, color:'#f59e0b', fontWeight:700, flexShrink:0 }}>⭐{story.rating}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Ranking Widget ───────────────────────────────────────────────
function RankingWidget({ stories }) {
  const [tab, setTab] = useState('day')
  const tabs = [['day','Ngày'],['week','Tuần'],['month','Tháng'],['year','Năm']]
  const ranked = [...stories].sort((a,b) => b.views - a.views).slice(0,10)
  return (
    <div className="rank-widget" style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', flexShrink:0, width:240 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 14px 8px' }}>
        <span style={{ fontWeight:800, fontSize:14, display:'flex', alignItems:'center', gap:6 }}>🏆 Bảng xếp hạng</span>
        <span style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>Top 10</span>
      </div>
      <div style={{ display:'flex', gap:4, padding:'0 10px 10px', flexWrap:'wrap' }}>
        {tabs.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:'4px 10px', borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:tab===k?'#6366f1':'#f1f5f9', color:tab===k?'#fff':'#6b7280', transition:'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>
      <div>
        {ranked.map((s,i) => (
          <Link key={s.id} to={`/truyen/${s.id}`}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', textDecoration:'none', color:'inherit', borderTop:'1px solid #f8fafc', transition:'background 0.1s' }}
            onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
            onMouseOut={e => e.currentTarget.style.background='transparent'}>
            <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, background:i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#cd7c2e':'#f1f5f9', color:i<3?'#fff':'#6b7280' }}>{i+1}</div>
            <img src={s.coverUrl} alt="" style={{ width:36, height:50, borderRadius:5, objectFit:'cover', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#1e293b' }}>{s.title}</div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>👁{(s.views/1000).toFixed(0)}K · ⭐{s.rating}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function HomePage({ auth, onLoginRequest }) {
  const [stories, setStories]  = useState(MOCK)
  const [genre, setGenre]      = useState('Tất cả')
  const [heroIdx, setHeroIdx]  = useState(0)
  const [shareStory, setShare] = useState(null)
  const [searchParams]         = useSearchParams()
  const search                 = searchParams.get('search') || ''

  useEffect(() => {
    getStories({ genre: genre==='Tất cả'?null:genre })
      .then(data => { if (data.length) setStories(data) })
      .catch(()=>{})
  }, [genre])

  // Auto-rotate hero
  useEffect(() => {
    if (search) return
    const t = setInterval(() => setHeroIdx(i => (i+1) % Math.min(3, MOCK.length)), 6000)
    return () => clearInterval(t)
  }, [search])

  const filtered  = search ? stories.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : stories
  const heroStory = filtered[heroIdx] || filtered[0]

  return (
    <div>
      {/* Hero */}
      {!search && heroStory && (
        <>
          <HeroBanner story={heroStory} />
          {/* Dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:-8, marginBottom:18 }}>
            {filtered.slice(0,3).map((_,i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                style={{ width:i===heroIdx?22:8, height:8, borderRadius:99, border:'none', background:i===heroIdx?'#6366f1':'#d1d5db', cursor:'pointer', transition:'all 0.3s', padding:0 }} />
            ))}
          </div>
        </>
      )}

      {/* Genre pills */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10, marginBottom:16, scrollbarWidth:'none' }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{ padding:'5px 14px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
              background:   genre===g?'#6366f1':'#fff',
              color:        genre===g?'#fff':'#6b7280',
              borderColor:  genre===g?'#6366f1':'#e2e8f0' }}>
            {g}
          </button>
        ))}
      </div>

      {/* 2-column: grid + ranking */}
      <div className="two-col" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

        {/* Story grid */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontSize:18 }}>🔥</span>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:'#1e293b' }}>
                {search ? `Kết quả: "${search}"` : 'Mới cập nhật'}
              </div>
              {!search && <div style={{ fontSize:11, color:'#6b7280' }}>Những truyện vừa có chương mới.</div>}
            </div>
          </div>

          {filtered.length === 0
            ? <p style={{ textAlign:'center', color:'#9ca3af', padding:'30px 0' }}>Không tìm thấy truyện nào.</p>
            : <div className="story-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:12 }}>
                {filtered.map(s => <StoryCard key={s.id} story={s} />)}
              </div>
          }
        </div>

        {/* Ranking */}
        <RankingWidget stories={stories} />
      </div>

      <div style={{ marginTop:16 }}>
        <AdBanner slot="top" />
      </div>

      {shareStory && <ShareModal story={shareStory} chapter={null} onClose={() => setShare(null)} />}
    </div>
  )
}
