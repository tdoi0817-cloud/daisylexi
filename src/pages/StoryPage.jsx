// src/pages/StoryPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStory, getChapters, incrementView } from '../lib/firestore'
import { AdBanner } from '../components/AdBanner'
import ShareModal from '../components/ShareModal'
import CommentSection from '../components/CommentSection'
import { useStoryMeta } from '../lib/seo'

const MOCK_STORY = {
  id:'1', title:'Vùng Đất Hứa',
  coverUrl:'https://picsum.photos/seed/s1/300/420',
  team:'Yên Khôi', genres:['Tình cảm','Drama','Cổ đại','Ngôn tình'],
  views:128400, rating:4.8, status:'Đang tiến hành',
  likes: 247, shares: 32,
  author:'Tác giả ẩn danh',
  updatedAt:{toDate:()=>new Date(Date.now()-15*3600000)},
  description:`Năm thứ bảy sau khi ly hôn, tôi về nước. Vì công việc, tôi đến một trang viên tư nhân để săn ảnh. Vô tình, một cô bé lọt vào ống kính của tôi.

Khoảnh khắc bấm máy, hiện lên trong khung hình là một khuôn mặt có đến tám phần giống tôi. Trái tim tôi chấn động kịch liệt, bàn tay cầm máy ảnh bất giác run lên.

"Tiểu thư." Vệ sĩ phía sau cô bé bước tới. Tôi bỗng nhận ra — đứa trẻ này không phải người xa lạ...`,
}

const MOCK_CHAPTERS = Array.from({length:9},(_,i)=>({
  id:`c${i+1}`, title:`Chương ${i+1}`, order:i+1,
  locked: i>=6, coinCost:5,
  thumbnail:`https://picsum.photos/seed/ch${i+1}t/80/80`,
  updatedAt:{toDate:()=>new Date(Date.now()-(i+1)*86400000)},
  readTime: 5+i, views: Math.floor(Math.random()*2000)+500,
}))

const RELATED_CATS = [
  {title:'Truyện ngôn tình cổ đại',    desc:'Cung đấu, gia đấu, xuyên không, điền văn...', path:'/the-loai/co-dai'},
  {title:'Truyện ngôn tình sủng',      desc:'Ngọt sủng, sủng văn, nam chính chiều vợ hết mực.', path:'/the-loai/sung'},
  {title:'Truyện nữ cường, đại nữ chủ',desc:'Nữ chính mạnh mẽ, độc lập, tự làm chủ cuộc đời và không chịu ai đến câu.', path:'/the-loai/nu-cuong'},
  {title:'Truyện ngôn tình mới nhất',  desc:'Danh sách truyện ngôn tình mới cập nhật liên tục, đủ mọi thể loại: hiện đại, cổ đại,...', path:'/the-loai/moi-nhat'},
]

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now()-d)/1000)
  if (s<3600)  return `${Math.floor(s/60)} phút trước`
  if (s<86400) return `${Math.floor(s/3600)} giờ trước`
  return `${Math.floor(s/86400)} ngày trước`
}

const CHAPTERS_PER_PAGE = 8

export default function StoryPage({ auth, onLoginRequest, onCoinModal }) {
  const { storyId } = useParams()
  const [story, setStory]       = useState(null)
  const [chapters, setChaps]    = useState(MOCK_CHAPTERS)
  const [shareOpen, setShare]   = useState(false)
  const [liked, setLiked]       = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sortAsc, setSortAsc]   = useState(false)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const chapterListRef          = useRef()

  useEffect(()=>{
    getStory(storyId).then(s=>{if(s)setStory(s)})
    getChapters(storyId).then(cs=>{if(cs.length)setChaps(cs)})
    incrementView(storyId).catch(()=>{})
  },[storyId])

  const s = story || {...MOCK_STORY, id:storyId}
  useStoryMeta(story) // Auto set OG tags + JSON-LD

  // Filter + sort chapters
  const filtered = chapters
    .filter(ch=>ch.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=> sortAsc ? a.order-b.order : b.order-a.order)

  const totalPages = Math.ceil(filtered.length / CHAPTERS_PER_PAGE)
  const paged = filtered.slice((page-1)*CHAPTERS_PER_PAGE, page*CHAPTERS_PER_PAGE)

  const firstChapter = [...chapters].sort((a,b)=>a.order-b.order)[0]
  const lastChapter  = [...chapters].sort((a,b)=>b.order-a.order)[0]

  const descLines = s.description?.split('\n').filter(Boolean) || []
  const shortDesc = descLines.slice(0,2).join('\n')

  const ROW = {display:'flex', alignItems:'center', gap:10, padding:'7px 0', fontSize:13, borderBottom:'1px solid #f8fafc'}
  const LABEL = {color:'#6b7280', minWidth:100, flexShrink:0, display:'flex', alignItems:'center', gap:6}

  return (
    <div>
      <Link to="/" style={{display:'inline-flex',alignItems:'center',gap:4,color:'#6b7280',fontSize:13,textDecoration:'none',marginBottom:14}}>← Trang chủ</Link>

      {/* ── Hero card ── */}
      <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8eaf0',padding:20,marginBottom:16,boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
        <div style={{display:'flex',gap:18,flexWrap:'wrap'}}>

          {/* Cover */}
          <div style={{flexShrink:0,position:'relative'}}>
            <img src={s.coverUrl} alt={s.title}
              style={{width:150,height:210,borderRadius:12,objectFit:'cover',display:'block',boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}} />
            <span style={{position:'absolute',top:8,left:8,background:s.status==='Đã đủ bộ'||s.status==='Hoàn thành'?'#16a34a':'#6366f1',color:'#fff',fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:800}}>
              {s.status==='Đã đủ bộ'||s.status==='Hoàn thành'?'FULL':'Đang TH'}
            </span>
          </div>

          {/* Info */}
          <div style={{flex:1,minWidth:200}}>
            <h1 style={{margin:'0 0 14px',fontSize:20,fontWeight:800,color:'#1e293b',lineHeight:1.3}}>{s.title}</h1>

            {/* Meta table */}
            <div style={{marginBottom:14}}>
              <div style={ROW}>
                <span style={LABEL}>🏷 Thể loại</span>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {(s.genres||[]).map(g=>(
                    <Link key={g} to={`/the-loai/${g}`} style={{background:'#f1f5f9',color:'#374151',fontSize:11,padding:'2px 8px',borderRadius:6,fontWeight:600,textDecoration:'none'}}>
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
              <div style={ROW}>
                <span style={LABEL}>👥 Nhóm dịch</span>
                <span style={{fontWeight:700,color:'#6366f1'}}>{s.team}</span>
                <span style={{fontSize:11,color:'#9ca3af',marginLeft:6}}>• {timeAgo(s.updatedAt)}</span>
              </div>
              <div style={ROW}>
                <span style={LABEL}>✍️ Tác giả</span>
                <span style={{fontWeight:600,color:'#374151'}}>{s.author||'Đang cập nhật'}</span>
              </div>
              <div style={ROW}>
                <span style={LABEL}>👁 Lượt xem</span>
                <span style={{fontWeight:600}}>{(s.views||0).toLocaleString('vi-VN')}</span>
                <span style={{color:'#9ca3af',margin:'0 8px'}}>•</span>
                <span style={{color:'#ef4444'}}>❤️ Yêu thích</span>
                <span style={{fontWeight:600,marginLeft:4}}>{s.likes||0}</span>
                <span style={{color:'#9ca3af',margin:'0 8px'}}>•</span>
                <span>🔗 Chia sẻ</span>
                <span style={{fontWeight:600,marginLeft:4}}>{s.shares||0}</span>
              </div>
              <div style={ROW}>
                <span style={LABEL}>📊 Trạng thái</span>
                <span style={{fontWeight:700,color:s.status==='Đã đủ bộ'||s.status==='Hoàn thành'?'#16a34a':'#6366f1'}}>
                  {s.status||'Đang tiến hành'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
              <Link to={`/truyen/${storyId}/chuong/${firstChapter?.id||'c1'}`}
                style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f97316',color:'#fff',borderRadius:10,padding:'10px 20px',fontWeight:800,fontSize:13,textDecoration:'none'}}>
                📖 Đọc từ đầu
              </Link>
              <Link to={`/truyen/${storyId}/chuong/${lastChapter?.id||'c1'}`}
                style={{display:'inline-flex',alignItems:'center',gap:6,background:'#16a34a',color:'#fff',borderRadius:10,padding:'10px 20px',fontWeight:800,fontSize:13,textDecoration:'none'}}>
                ⚡ Đọc tập mới
              </Link>
            </div>

            {/* Secondary buttons */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>{if(!auth?.user){onLoginRequest();return}setLiked(l=>!l)}}
                style={{display:'inline-flex',alignItems:'center',gap:5,background:liked?'#fef2f2':'#f8fafc',border:`1.5px solid ${liked?'#fca5a5':'#e2e8f0'}`,borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,color:liked?'#ef4444':'#374151'}}>
                {liked?'❤️':'🤍'} Yêu thích
              </button>
              <button onClick={()=>setShare(true)}
                style={{display:'inline-flex',alignItems:'center',gap:5,background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,color:'#374151'}}>
                🔗 Chia sẻ
              </button>
              <button style={{display:'inline-flex',alignItems:'center',gap:5,background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,color:'#374151'}}>
                🚩 Báo lỗi
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{marginTop:18,padding:'14px 16px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:13,color:'#374151',lineHeight:1.9,whiteSpace:'pre-line'}}>
            {expanded ? s.description : shortDesc}
          </div>
          {descLines.length>2 && (
            <button onClick={()=>setExpanded(e=>!e)}
              style={{background:'none',border:'none',color:'#6366f1',fontSize:13,fontWeight:700,cursor:'pointer',padding:'6px 0 0',display:'flex',alignItems:'center',gap:4}}>
              {expanded?'Thu gọn ▲':'Xem thêm ▼'}
            </button>
          )}
        </div>
      </div>

      <AdBanner slot="top" />

      {/* ── Chapter list ── */}
      <div ref={chapterListRef} style={{background:'#fff',borderRadius:16,border:'1px solid #e8eaf0',overflow:'hidden',marginBottom:16}}>

        {/* Header + controls */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:10}}>
            {/* Sort */}
            <button onClick={()=>{setSortAsc(a=>!a);setPage(1)}}
              style={{display:'inline-flex',alignItems:'center',gap:5,background:'#f1f5f9',border:'1.5px solid #e2e8f0',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#374151'}}>
              {sortAsc?'↑ Tăng dần':'↓ Giảm dần'}
            </button>

            {/* Search */}
            <div style={{flex:1,minWidth:140,position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#9ca3af'}}>🔍</span>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                placeholder="Tìm chương..."
                style={{width:'100%',padding:'7px 10px 7px 30px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}
                onFocus={e=>e.target.style.borderColor='#6366f1'}
                onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
            </div>

            {/* Total */}
            <span style={{fontSize:12,color:'#6b7280',fontWeight:600,whiteSpace:'nowrap',marginLeft:'auto'}}>
              Tổng: <strong>{filtered.length}</strong> chương • Trang <strong>{page}</strong> / <strong>{totalPages||1}</strong>
            </span>
          </div>
        </div>

        {/* Chapter grid — 2 columns giống screenshot */}
        {paged.length===0 ? (
          <p style={{textAlign:'center',padding:'30px',color:'#9ca3af',fontSize:13}}>Không tìm thấy chương nào.</p>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
            {paged.map((ch,i)=>{
              const isLocked=ch.locked&&!ch.unlocked
              return (
                <Link key={ch.id} to={`/truyen/${storyId}/chuong/${ch.id}`}
                  style={{textDecoration:'none',color:'inherit',display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderBottom:'1px solid #f1f5f9',borderRight:i%2===0?'1px solid #f1f5f9':'none',transition:'background 0.1s'}}
                  onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>

                  {/* Chapter icon */}
                  <div style={{width:38,height:38,borderRadius:8,background:isLocked?'#fef3c7':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,fontWeight:800,color:isLocked?'#92400e':'#6d28d9'}}>
                    {isLocked?'🔒':`Ch.${ch.order}`}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <span style={{fontSize:11,color:'#9ca3af'}}>⏱ {timeAgo(ch.updatedAt)}</span>
                      <span style={{fontSize:11,color:'#9ca3af',marginLeft:'auto'}}>👁 {(ch.views||0).toLocaleString()}</span>
                    </div>
                    <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:isLocked?'#9ca3af':'#1e293b'}}>
                      {ch.title}
                    </div>
                  </div>

                  {isLocked&&(
                    <span style={{flexShrink:0,fontSize:11,color:'#f59e0b',fontWeight:700}}>
                      {ch.coinCost}xu
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages>1&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 16px',borderTop:'1px solid #f1f5f9'}}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{display:'flex',alignItems:'center',gap:4,padding:'7px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,background:'#fff',fontSize:12,fontWeight:600,cursor:page===1?'default':'pointer',color:page===1?'#9ca3af':'#374151',opacity:page===1?0.5:1}}>
              ← Trước
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                style={{width:32,height:32,border:'1.5px solid',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',background:page===p?'#6366f1':'#fff',color:page===p?'#fff':'#374151',borderColor:page===p?'#6366f1':'#e2e8f0'}}>
                {p}
              </button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{display:'flex',alignItems:'center',gap:4,padding:'7px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,background:'#fff',fontSize:12,fontWeight:600,cursor:page===totalPages?'default':'pointer',color:page===totalPages?'#9ca3af':'#374151',opacity:page===totalPages?0.5:1}}>
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* ── Bình luận ── */}
      <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8eaf0',padding:20,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>
            <span style={{background:'#6366f1',color:'#fff',width:26,height:26,borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}>💬</span>
            Bình luận
          </h3>
        </div>
        <CommentSection storyId={storyId} chapterId="general" user={auth?.user} onLoginRequest={onLoginRequest} />
      </div>

      {/* ── Truyện liên quan ── */}
      <div style={{background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden',marginBottom:20}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:'#1e293b'}}>📚 Gợi ý danh sách truyện liên quan</h3>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
          {RELATED_CATS.map((item,i)=>(
            <Link key={item.title} to={item.path}
              style={{textDecoration:'none',color:'inherit',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:i<2?'1px solid #f1f5f9':'none',borderRight:i%2===0?'1px solid #f1f5f9':'none',transition:'background 0.15s',gap:12}}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:'#1e293b',marginBottom:3}}>{item.title}</div>
                <div style={{fontSize:12,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.desc}</div>
              </div>
              <span style={{flexShrink:0,fontSize:12,fontWeight:700,color:'#6366f1',background:'#ede9fe',padding:'5px 12px',borderRadius:8}}>Xem</span>
            </Link>
          ))}
        </div>
      </div>

      {shareOpen&&<ShareModal story={s} chapter={null} onClose={()=>setShare(false)} />}
    </div>
  )
}
