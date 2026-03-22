// src/pages/TeamPage.jsx — Hall of Fame CTV
import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Link } from 'react-router-dom'

// ── Mock data (fallback khi chưa có Firestore data) ───────────────
const MOCK_MEMBERS = [
  { id:'1', displayName:'Ô Mặt Mặt',               photoURL:'https://picsum.photos/seed/u1/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Chưa có giới thiệu...', joinedAt:'12/03/2026', stories:14, totalViews:284000, totalLikes:1240, revenue:850000, online:true  },
  { id:'2', displayName:'Trong Tim Có Cậu',         photoURL:'https://picsum.photos/seed/u2/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Chưa có giới thiệu...', joinedAt:'07/02/2026', stories:9,  totalViews:196000, totalLikes:870,  revenue:620000, online:false },
  { id:'3', displayName:'Mỗi Ngày Chỉ Muốn Quạc',  photoURL:'https://picsum.photos/seed/u3/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Hãy gọi sắp là Zit. Một con zit chỉ muốn quạc quạc quạc mỗi ngày :>', joinedAt:'15/01/2026', stories:22, totalViews:510000, totalLikes:3200, revenue:1800000, online:true  },
  { id:'4', displayName:'Nguyệt Sắt Tinh C',        photoURL:'https://picsum.photos/seed/u4/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Chưa có giới thiệu...', joinedAt:'18/01/2026', stories:7,  totalViews:143000, totalLikes:620,  revenue:430000, online:true  },
  { id:'5', displayName:'Mèo Bùng Beo',             photoURL:'https://picsum.photos/seed/u5/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Chưa có giới thiệu...', joinedAt:'09/01/2026', stories:11, totalViews:230000, totalLikes:980,  revenue:710000, online:false },
  { id:'6', displayName:'Cá Chép Ngẩm Mưa',         photoURL:'https://picsum.photos/seed/u6/80/80',  role:'ctv', badge:'PUBLISHER', badgeRole:'Contributor', bio:'Vừa edit vừa ngẩm mưa',  joinedAt:'09/01/2026', stories:18, totalViews:392000, totalLikes:2100, revenue:1200000, online:true  },
  { id:'7', displayName:'Lạc Giới Tinh Thư',         photoURL:'https://picsum.photos/seed/u7/80/80',  role:'admin', badge:'ADMIN TEAM', badgeRole:'Core Member', bio:'Nhóm dịch ngôn tình hiện đại, mang đến những câu chuyện tình yêu đầy cảm xúc, chân thật và sâu sắc...', joinedAt:'20/10/2025', stories:35, totalViews:820000, totalLikes:5600, revenue:3200000, online:true  },
  { id:'8', displayName:'Mèo Kam Mập',               photoURL:'https://picsum.photos/seed/u8/80/80',  role:'admin', badge:'ADMIN TEAM', badgeRole:'Core Member', bio:'Chưa có giới thiệu...', joinedAt:'19/10/2025', stories:42, totalViews:1200000, totalLikes:8900, revenue:4500000, online:true  },
]

// ── Tính hoa hồng ───────────────────────────────────────────────
const COMMISSION_RATE = 0.15  // 15% doanh thu từ xu
function calcCommission(member) {
  return Math.round(member.revenue * COMMISSION_RATE)
}

// ── Rank badge ──────────────────────────────────────────────────
function getRankInfo(member, allMembers) {
  const sorted = [...allMembers].sort((a,b) => b.totalViews - a.totalViews)
  const rank   = sorted.findIndex(m => m.id === member.id) + 1
  if (rank === 1) return { label:'#1 Top', color:'#f59e0b', bg:'#fef3c7' }
  if (rank === 2) return { label:'#2',     color:'#6b7280', bg:'#f1f5f9' }
  if (rank === 3) return { label:'#3',     color:'#cd7c2e', bg:'#fef9ec' }
  return { label:`#${rank}`, color:'#6366f1', bg:'#ede9fe' }
}

function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n/1000).toFixed(0) + 'K'
  return n.toString()
}
function fmtVnd(n) {
  return n.toLocaleString('vi-VN') + '₫'
}

// ── Member Card ──────────────────────────────────────────────────
function MemberCard({ member, allMembers, showRevenue }) {
  const rank    = getRankInfo(member, allMembers)
  const isAdmin = member.badge === 'ADMIN TEAM'

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:18, position:'relative', transition:'transform 0.15s, box-shadow 0.15s' }}
      onMouseOver={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseOut={e =>  { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>

      {/* Badge top-left */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, background: isAdmin?'#fef3c7':'#ede9fe', color: isAdmin?'#92400e':'#6d28d9', display:'flex', alignItems:'center', gap:5 }}>
          {isAdmin ? '👑' : '✏️'} {member.badge}
        </span>
        {/* Rank */}
        <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, background: rank.bg, color: rank.color }}>
          {rank.label}
        </span>
      </div>

      {/* Arrow link */}
      <div style={{ position:'absolute', top:16, right:16, color:'#6366f1', fontSize:16, cursor:'pointer' }}>↗</div>

      {/* Avatar + name */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <img src={member.photoURL} alt={member.displayName}
            style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0' }} />
          <span style={{ position:'absolute', bottom:1, right:1, width:12, height:12, borderRadius:'50%', background: member.online?'#16a34a':'#9ca3af', border:'2px solid #fff' }} />
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:14, color:'#1e293b', lineHeight:1.2 }}>{member.displayName}</div>
          <div style={{ fontSize:11, color:'#f59e0b', fontWeight:600, display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
            ⭐ {member.badgeRole}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p style={{ margin:'0 0 12px', fontSize:12, color:'#6b7280', lineHeight:1.5, minHeight:36, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {member.bio}
      </p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
        {[
          { label:'Truyện',    value: member.stories },
          { label:'Views',     value: fmt(member.totalViews) },
          { label:'Likes',     value: fmt(member.totalLikes) },
        ].map(s => (
          <div key={s.label} style={{ background:'#f8fafc', borderRadius:8, padding:'7px 6px', textAlign:'center' }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#1e293b' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue + commission (chỉ show với admin) */}
      {showRevenue && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:'#166534', fontWeight:600 }}>Doanh thu từ xu</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#166534' }}>{fmtVnd(member.revenue)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#16a34a', fontWeight:600 }}>Hoa hồng (15%)</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#16a34a' }}>{fmtVnd(calcCommission(member))}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'#9ca3af' }}>
        <span>THAM GIA: {member.joinedAt}</span>
        <button style={{ fontSize:12, color:'#6366f1', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Xem Profile</button>
      </div>
    </div>
  )
}

export default function TeamPage({ auth }) {
  const [members, setMembers]       = useState(MOCK_MEMBERS)
  const [sortBy, setSortBy]         = useState('views')
  const [showRevenue, setRevenue]   = useState(false)
  const [filterRole, setFilterRole] = useState('all')
  const isAdmin = auth?.user?.role === 'admin'

  useEffect(() => {
    // Load thật từ Firestore
    getDocs(query(collection(db, 'users'), orderBy('createdAt','asc')))
      .then(snap => {
        const real = snap.docs
          .map(d => ({id:d.id,...d.data()}))
          .filter(u => u.role === 'ctv' || u.role === 'admin')
        if (real.length) setMembers(real)
      }).catch(() => {})
  }, [])

  const sorted = [...members]
    .filter(m => filterRole === 'all' || m.role === filterRole)
    .sort((a,b) => {
      if (sortBy==='views')    return (b.totalViews||0)  - (a.totalViews||0)
      if (sortBy==='stories')  return (b.stories||0)     - (a.stories||0)
      if (sortBy==='likes')    return (b.totalLikes||0)  - (a.totalLikes||0)
      if (sortBy==='revenue')  return (b.revenue||0)     - (a.revenue||0)
      return 0
    })

  const totalViews    = members.reduce((a,m)=>a+(m.totalViews||0),0)
  const totalStories  = members.reduce((a,m)=>a+(m.stories||0),0)
  const totalRevenue  = members.reduce((a,m)=>a+(m.revenue||0),0)

  return (
    <div>
      {/* Hero header — giống screenshot */}
      <div style={{ padding:'40px 0 30px' }}>
        <div style={{ fontSize:13, color:'#f59e0b', fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
          ⭐ The Hall of Fame
        </div>
        <h1 style={{ margin:'0 0 8px', fontSize:38, fontWeight:900, lineHeight:1.1, color:'#1e293b' }}>
          Gương mặt<br/>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Nhà Dịch Giả.
          </span>
        </h1>
        <p style={{ margin:'0', fontSize:14, color:'#6b7280', maxWidth:320, lineHeight:1.6 }}>
          Nơi vinh danh những tài năng đứng sau các bản chuyển ngữ chất lượng, mang tác phẩm đến gần hơn với độc giả.
        </p>

        {/* Tổng nhân sự */}
        <div style={{ position:'absolute', right:0, top:40, background:'#1e293b', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:'#6366f1', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚡</div>
          <div>
            <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, letterSpacing:2 }}>TỔNG NHÂN SỰ</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#fff', lineHeight:1 }}>{String(members.length).padStart(2,'0')}</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Tổng truyện',  value: totalStories,          icon:'📚', color:'#ede9fe', text:'#6d28d9' },
          { label:'Tổng views',   value: fmt(totalViews),        icon:'👁',  color:'#dcfce7', text:'#166534' },
          { label:'Tổng doanh thu',value:fmtVnd(totalRevenue),   icon:'💰', color:'#fef3c7', text:'#92400e' },
        ].map(s=>(
          <div key={s.label} style={{ background:s.color, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:s.text }}>{s.value}</div>
              <div style={{ fontSize:11, color:s.text, opacity:0.8 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20, alignItems:'center' }}>
        {/* Sort */}
        <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:10, padding:3 }}>
          {[['views','👁 Views'],['stories','📚 Truyện'],['likes','❤️ Likes'],['revenue','💰 Doanh thu']].map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)}
              style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: sortBy===k?'#fff':'transparent', color: sortBy===k?'#6366f1':'#6b7280', boxShadow: sortBy===k?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Filter role */}
        <div style={{ display:'flex', gap:4 }}>
          {[['all','Tất cả'],['ctv','Publisher'],['admin','Admin Team']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilterRole(k)}
              style={{ padding:'6px 12px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.15s', background: filterRole===k?'#6366f1':'#fff', color: filterRole===k?'#fff':'#6b7280', borderColor: filterRole===k?'#6366f1':'#e2e8f0' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Show revenue toggle (admin only) */}
        {isAdmin && (
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, marginLeft:'auto' }}>
            <input type="checkbox" checked={showRevenue} onChange={e=>setRevenue(e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            💰 Hiện doanh thu & hoa hồng
          </label>
        )}
      </div>

      {/* Member grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:24, position:'relative' }}>
        {sorted.map(m=>(
          <MemberCard key={m.id} member={m} allMembers={members} showRevenue={isAdmin && showRevenue} />
        ))}

        {/* Join CTV card — giống screenshot */}
        <div style={{ background:'#fff', borderRadius:14, border:'2px dashed #d1d5db', padding:18, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200, gap:10 }}>
          <div style={{ fontSize:36 }}>✦</div>
          <div style={{ fontWeight:800, fontSize:15, color:'#374151' }}>Trở thành Dịch giả?</div>
          <p style={{ margin:0, fontSize:13, color:'#6b7280', textAlign:'center', lineHeight:1.5 }}>
            Gia nhập đội ngũ, kiếm thu nhập và xuất hiện trên bảng vàng này.
          </p>
          <Link to="/ctv"
            style={{ marginTop:4, background:'#6366f1', color:'#fff', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:13, textDecoration:'none' }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>

      {/* Commission table (admin only) */}
      {isAdmin && showRevenue && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>💰</span>
            <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>Bảng hoa hồng tháng này</h3>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#9ca3af' }}>Rate: 15% doanh thu</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','CTV','Truyện','Views','Likes','Doanh thu','Hoa hồng (15%)','Trạng thái'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...members].sort((a,b)=>(b.revenue||0)-(a.revenue||0)).map((m,i)=>(
                  <tr key={m.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', fontWeight:800, color: i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#cd7c2e':'#6b7280' }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <img src={m.photoURL} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} />
                        <span style={{ fontWeight:700 }}>{m.displayName}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#374151' }}>{m.stories||0}</td>
                    <td style={{ padding:'10px 14px', color:'#374151' }}>{fmt(m.totalViews||0)}</td>
                    <td style={{ padding:'10px 14px', color:'#374151' }}>{fmt(m.totalLikes||0)}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:'#1e293b' }}>{fmtVnd(m.revenue||0)}</td>
                    <td style={{ padding:'10px 14px', fontWeight:800, color:'#16a34a' }}>{fmtVnd(calcCommission(m))}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>Chờ thanh toán</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'2px solid #e8eaf0', background:'#f8fafc' }}>
                  <td colSpan={6} style={{ padding:'10px 14px', fontWeight:800, textAlign:'right' }}>Tổng hoa hồng cần thanh toán:</td>
                  <td style={{ padding:'10px 14px', fontWeight:900, color:'#16a34a', fontSize:15 }}>
                    {fmtVnd(members.reduce((a,m)=>a+calcCommission(m),0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
