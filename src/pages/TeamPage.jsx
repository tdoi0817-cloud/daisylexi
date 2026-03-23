// src/pages/TeamPage.jsx — Hall of Fame (Full English)
import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Link } from 'react-router-dom'

const MOCK_MEMBERS = [
  { id:'1', displayName:'Readunlocked',           photoURL:'https://picsum.photos/seed/u8/80/80',  role:'admin', badge:'ADMIN TEAM', badgeRole:'Core Member',  bio:'',                                                                              joinedAt:'Oct 19, 2025', stories:42, totalViews:1200000, totalLikes:8900, revenue:4500000, online:true  },
  { id:'2', displayName:'Lac Gioi Tinh Thu',       photoURL:'https://picsum.photos/seed/u7/80/80',  role:'admin', badge:'ADMIN TEAM', badgeRole:'Core Member',  bio:'Modern romance translation team — bringing heartfelt, authentic love stories closer to readers.', joinedAt:'Oct 20, 2025', stories:35, totalViews:820000,  totalLikes:6000, revenue:3200000, online:true  },
  { id:'3', displayName:'Moi Ngay Chi Muon Quac',  photoURL:'https://picsum.photos/seed/u3/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'Call me Zit. A little zit that just wants to quack quack every day :>',               joinedAt:'Jan 15, 2026', stories:22, totalViews:510000,  totalLikes:3200, revenue:1800000, online:true  },
  { id:'4', displayName:'O Mat Mat',               photoURL:'https://picsum.photos/seed/u1/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'',                                                                              joinedAt:'Mar 12, 2026', stories:14, totalViews:284000,  totalLikes:1240, revenue:850000,  online:true  },
  { id:'5', displayName:'Trong Tim Co Cau',        photoURL:'https://picsum.photos/seed/u2/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'',                                                                              joinedAt:'Feb 07, 2026', stories:9,  totalViews:196000,  totalLikes:870,  revenue:620000,  online:false },
  { id:'6', displayName:'Nguyet Sat Tinh C',       photoURL:'https://picsum.photos/seed/u4/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'',                                                                              joinedAt:'Jan 18, 2026', stories:7,  totalViews:143000,  totalLikes:620,  revenue:430000,  online:true  },
  { id:'7', displayName:'Meo Bung Beo',            photoURL:'https://picsum.photos/seed/u5/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'',                                                                              joinedAt:'Jan 09, 2026', stories:11, totalViews:230000,  totalLikes:980,  revenue:710000,  online:false },
  { id:'8', displayName:'Ca Chep Ngam Mua',        photoURL:'https://picsum.photos/seed/u6/80/80',  role:'ctv',   badge:'PUBLISHER',  badgeRole:'Contributor', bio:'Editing while daydreaming in the rain.',                                         joinedAt:'Jan 09, 2026', stories:18, totalViews:392000,  totalLikes:2100, revenue:1200000, online:true  },
]

const COMMISSION_RATE = 0.15

function calcCommission(m) { return Math.round((m.revenue||0) * COMMISSION_RATE) }

function getRank(member, all) {
  const sorted = [...all].sort((a,b) => (b.totalViews||0) - (a.totalViews||0))
  const rank = sorted.findIndex(m => m.id === member.id) + 1
  if (rank === 1) return { label:'#1 Top', color:'#f59e0b', bg:'#fef3c7' }
  if (rank === 2) return { label:'#2',     color:'#6b7280', bg:'#f1f5f9' }
  if (rank === 3) return { label:'#3',     color:'#cd7c2e', bg:'#fef9ec' }
  return { label:`#${rank}`, color:'#6366f1', bg:'#ede9fe' }
}

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n/1000).toFixed(0) + 'K'
  return String(n)
}
function fmtVnd(n) { return (n||0).toLocaleString('vi-VN') + '₫' }

function MemberCard({ member, all, showRevenue }) {
  const rank    = getRank(member, all)
  const isAdmin = member.badge === 'ADMIN TEAM'
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eaf0', padding:20, position:'relative', transition:'transform 0.15s, box-shadow 0.15s' }}
      onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}}
      onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>

      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, background:isAdmin?'#fef3c7':'#ede9fe', color:isAdmin?'#92400e':'#6d28d9', display:'flex', alignItems:'center', gap:5 }}>
          {isAdmin ? '👑' : '✏️'} {member.badge}
        </span>
        <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, background:rank.bg, color:rank.color }}>
          {rank.label}↗
        </span>
      </div>

      {/* Avatar + name */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <img src={member.photoURL} alt={member.displayName}
            style={{ width:58, height:58, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0' }} />
          <span style={{ position:'absolute', bottom:1, right:1, width:13, height:13, borderRadius:'50%', background:member.online?'#16a34a':'#9ca3af', border:'2px solid #fff' }} />
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:'#1e293b', lineHeight:1.2 }}>{member.displayName}</div>
          <div style={{ fontSize:12, color:'#f59e0b', fontWeight:600, marginTop:4 }}>⭐ {member.badgeRole}</div>
        </div>
      </div>

      {/* Bio */}
      <p style={{ margin:'0 0 14px', fontSize:12, color:'#6b7280', lineHeight:1.5, minHeight:34, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {member.bio || 'No bio yet.'}
      </p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:14 }}>
        {[
          { label:'Stories', value: member.stories || 0 },
          { label:'Views',   value: fmt(member.totalViews) },
          { label:'Likes',   value: fmt(member.totalLikes) },
        ].map(s => (
          <div key={s.label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
            <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue (admin only) */}
      {showRevenue && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, color:'#166534', fontWeight:600 }}>Coin Revenue</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#166534' }}>{fmtVnd(member.revenue)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#16a34a', fontWeight:600 }}>Commission (15%)</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#16a34a' }}>{fmtVnd(calcCommission(member))}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'#9ca3af' }}>
        <span>JOINED: {member.joinedAt}</span>
        <button style={{ fontSize:12, color:'#6366f1', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>View Profile</button>
      </div>
    </div>
  )
}

export default function TeamPage({ auth }) {
  const [members, setMembers]     = useState(MOCK_MEMBERS)
  const [sortBy, setSortBy]       = useState('views')
  const [showRevenue, setRevenue] = useState(false)
  const [filterRole, setFilter]   = useState('all')
  const isAdmin = auth?.user?.role === 'admin'

  useEffect(() => {
    getDocs(query(collection(db,'users'), orderBy('createdAt','asc')))
      .then(snap => {
        const real = snap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.role==='ctv'||u.role==='admin')
        if (real.length) setMembers(real)
      }).catch(()=>{})
  }, [])

  const sorted = [...members]
    .filter(m => filterRole==='all' || m.role===filterRole)
    .sort((a,b) => {
      if (sortBy==='views')   return (b.totalViews||0)  - (a.totalViews||0)
      if (sortBy==='stories') return (b.stories||0)     - (a.stories||0)
      if (sortBy==='likes')   return (b.totalLikes||0)  - (a.totalLikes||0)
      if (sortBy==='revenue') return (b.revenue||0)     - (a.revenue||0)
      return 0
    })

  const totalViews   = members.reduce((a,m)=>a+(m.totalViews||0),0)
  const totalStories = members.reduce((a,m)=>a+(m.stories||0),0)
  const totalRevenue = members.reduce((a,m)=>a+(m.revenue||0),0)

  return (
    <div style={{ position:'relative' }}>
      {/* Hero */}
      <div style={{ padding:'40px 0 28px', position:'relative' }}>
        <div style={{ fontSize:13, color:'#f59e0b', fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
          ⭐ The Hall of Fame
        </div>
        <h1 style={{ margin:'0 0 10px', fontSize:40, fontWeight:900, lineHeight:1.1, color:'#1e293b' }}>
          Meet Our<br/>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Translators.
          </span>
        </h1>
        <p style={{ margin:0, fontSize:14, color:'#6b7280', maxWidth:340, lineHeight:1.6 }}>
          Celebrating the talented people behind every quality translation, bringing stories closer to readers worldwide.
        </p>

        {/* Total members badge */}
        <div style={{ position:'absolute', right:0, top:40, background:'#1e293b', borderRadius:16, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:'#6366f1', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚡</div>
          <div>
            <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, letterSpacing:2 }}>TOTAL MEMBERS</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#fff', lineHeight:1 }}>{String(members.length).padStart(2,'0')}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Stories',  value: totalStories,      icon:'📚', color:'#ede9fe', text:'#6d28d9' },
          { label:'Total Views',    value: fmt(totalViews),    icon:'👁',  color:'#dcfce7', text:'#166534' },
          { label:'Total Revenue',  value: fmtVnd(totalRevenue),icon:'💰', color:'#fef3c7', text:'#92400e' },
        ].map(s => (
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
          {[['views','👁 Views'],['stories','📚 Stories'],['likes','❤️ Likes'],['revenue','💰 Revenue']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)}
              style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:sortBy===k?'#fff':'transparent', color:sortBy===k?'#6366f1':'#6b7280', boxShadow:sortBy===k?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:'flex', gap:4 }}>
          {[['all','All'],['ctv','Publisher'],['admin','Admin Team']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.15s', background:filterRole===k?'#6366f1':'#fff', color:filterRole===k?'#fff':'#6b7280', borderColor:filterRole===k?'#6366f1':'#e2e8f0' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Revenue toggle (admin only) */}
        {isAdmin && (
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, marginLeft:'auto' }}>
            <input type="checkbox" checked={showRevenue} onChange={e => setRevenue(e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            💰 Show Revenue & Commission
          </label>
        )}
      </div>

      {/* Member grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:24 }}>
        {sorted.map(m => (
          <MemberCard key={m.id} member={m} all={members} showRevenue={isAdmin && showRevenue} />
        ))}

        {/* Join CTA card */}
        <div style={{ background:'#fff', borderRadius:16, border:'2px dashed #d1d5db', padding:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200, gap:10 }}>
          <div style={{ fontSize:36 }}>✦</div>
          <div style={{ fontWeight:800, fontSize:15, color:'#374151' }}>Become a Translator?</div>
          <p style={{ margin:0, fontSize:13, color:'#6b7280', textAlign:'center', lineHeight:1.5 }}>
            Join our team, earn revenue and appear on this Hall of Fame.
          </p>
          <Link to="/ctv"
            style={{ marginTop:4, background:'#6366f1', color:'#fff', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:13, textDecoration:'none' }}>
            Apply Now
          </Link>
        </div>
      </div>

      {/* Commission table (admin only) */}
      {isAdmin && showRevenue && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>💰</span>
            <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>Monthly Commission Breakdown</h3>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#9ca3af' }}>Rate: 15% of revenue</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Rank','Translator','Stories','Views','Likes','Revenue','Commission (15%)','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...members].sort((a,b)=>(b.revenue||0)-(a.revenue||0)).map((m,i) => (
                  <tr key={m.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', fontWeight:800, color:i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#cd7c2e':'#6b7280' }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <img src={m.photoURL} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} />
                        <span style={{ fontWeight:700 }}>{m.displayName}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>{m.stories||0}</td>
                    <td style={{ padding:'10px 14px' }}>{fmt(m.totalViews||0)}</td>
                    <td style={{ padding:'10px 14px' }}>{fmt(m.totalLikes||0)}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700 }}>{fmtVnd(m.revenue||0)}</td>
                    <td style={{ padding:'10px 14px', fontWeight:800, color:'#16a34a' }}>{fmtVnd(calcCommission(m))}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'2px solid #e8eaf0', background:'#f8fafc' }}>
                  <td colSpan={6} style={{ padding:'10px 14px', fontWeight:800, textAlign:'right' }}>Total commission to pay:</td>
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
