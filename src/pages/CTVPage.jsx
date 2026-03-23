// src/pages/CTVPage.jsx — Contributor signup & earnings calculator
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const AFFILIATE_RATE  = 6   // đ per chapter read via affiliate
const PUBLISHER_RATE  = 8   // đ per chapter read as publisher
const READ_RATES = [
  { label:'Light (6 ch)',    value:6,   desc:'Reader tries, reads a few' },
  { label:'Average (12 ch)', value:12,  desc:'Typical engaged reader' },
  { label:'Hooked (36 ch)',  value:36,  desc:'Binge reads everything' },
]

export default function CTVPage({ auth, onLoginRequest }) {
  const [role,       setRole]     = useState(null)       // 'affiliate' | 'publisher'
  const [calcMode,   setCalcMode] = useState('affiliate')
  const [readers,    setReaders]  = useState(1000)
  const [chapRead,   setChapRead] = useState(12)
  const [applying,   setApplying] = useState(false)
  const [applied,    setApplied]  = useState(false)
  const [showForm,   setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', channel:'', note:'' })

  const rate = calcMode === 'affiliate' ? AFFILIATE_RATE : PUBLISHER_RATE
  const estimated = readers * chapRead * rate

  const apply = async () => {
    if (!form.name || !form.email) return
    setApplying(true)
    try {
      await addDoc(collection(db,'ctvApplications'), {
        ...form, role:role||calcMode,
        userId: auth?.user?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setApplied(true)
    } finally { setApplying(false) }
  }

  const IS = { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  if (applied) return (
    <div style={{ maxWidth:520, margin:'60px auto', textAlign:'center', padding:20 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
      <h2 style={{ margin:'0 0 10px', fontSize:22, fontWeight:800 }}>Application Submitted!</h2>
      <p style={{ color:'#6b7280', fontSize:15, lineHeight:1.7, margin:'0 0 24px' }}>
        We'll review your application and get back to you within 1-3 business days.
        Once approved, you'll get access to your contributor dashboard.
      </p>
      <Link to="/" style={{ display:'inline-block', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', textDecoration:'none', borderRadius:12, padding:'12px 28px', fontWeight:800 }}>
        Back to Reading
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth:820, margin:'0 auto', padding:'0 16px 60px' }}>

      {/* Hero */}
      <div style={{ padding:'48px 0 36px', textAlign:'left' }}>
        <h1 style={{ margin:'0 0 12px', fontSize:36, fontWeight:900, lineHeight:1.1, color:'#1e293b' }}>
          Earn with <span style={{ color:'#6366f1' }}>Readunlocked</span>
        </h1>
        <p style={{ margin:'0 0 8px', fontSize:15, color:'#374151', lineHeight:1.7, maxWidth:480 }}>
          This program lets you earn from stories — either by <strong>posting content</strong> or by <strong>bringing in readers</strong> via your link.
        </p>
        <p style={{ margin:0, fontSize:14, color:'#6b7280' }}>
          No investment needed. Just pick the role that fits you below.
        </p>

        {/* Status badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:16, padding:'8px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13 }}>
          <span style={{ color:'#9ca3af' }}>Your status:</span>
          <strong style={{ color: role ? '#6366f1' : '#9ca3af' }}>{role ? `✓ ${role.charAt(0).toUpperCase()+role.slice(1)} selected` : 'Not chosen yet'}</strong>
          {role && <button onClick={()=>setRole(null)} style={{ background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:12 }}>Change</button>}
        </div>
      </div>

      {/* Role cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:36 }}>
        {/* Affiliate */}
        <div style={{ background:'#fff', border:`2px solid ${role==='affiliate'?'#6366f1':'#e8eaf0'}`, borderRadius:16, padding:24, transition:'border-color 0.2s' }}>
          <div style={{ width:44, height:44, background:'#f0fdf4', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>📢</div>
          <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800 }}>Affiliate</h3>
          <p style={{ margin:'0 0 14px', fontSize:13, color:'#6b7280' }}>
            For people who promote stories (group / page / channel...)
          </p>
          <ul style={{ margin:'0 0 16px', paddingLeft:18, fontSize:13, color:'#374151', lineHeight:2 }}>
            <li>You have a place to post (group, page, TikTok, Zalo...)</li>
            <li>You're good at PR and bringing in readers</li>
            <li>Earn from readers who come through your shared link</li>
          </ul>
          <button onClick={()=>setRole('affiliate')}
            style={{ width:'100%', padding:'11px', background: role==='affiliate'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#f1f5f9', color:role==='affiliate'?'#fff':'#374151', border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
            {role==='affiliate' ? '✓ Selected' : 'Sign up as Affiliate →'}
          </button>
          <p style={{ margin:'8px 0 0', fontSize:11, color:'#9ca3af', textAlign:'center' }}>~{AFFILIATE_RATE}đ per chapter read</p>
        </div>

        {/* Publisher */}
        <div style={{ background:'#fff', border:`2px solid ${role==='publisher'?'#6366f1':'#e8eaf0'}`, borderRadius:16, padding:24, transition:'border-color 0.2s' }}>
          <div style={{ width:44, height:44, background:'#ede9fe', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>📚</div>
          <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800 }}>Publisher</h3>
          <p style={{ margin:'0 0 14px', fontSize:13, color:'#6b7280' }}>
            For people who post stories (author / editor / translation group)
          </p>
          <ul style={{ margin:'0 0 16px', paddingLeft:18, fontSize:13, color:'#374151', lineHeight:2 }}>
            <li>You have stories (or are making them)</li>
            <li>You need a place for readers to find your work</li>
            <li>Earn directly from your posted chapters</li>
          </ul>
          <button onClick={()=>setRole('publisher')}
            style={{ width:'100%', padding:'11px', background: role==='publisher'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#f1f5f9', color:role==='publisher'?'#fff':'#374151', border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
            {role==='publisher' ? '✓ Selected' : 'Sign up as Publisher →'}
          </button>
          <p style={{ margin:'8px 0 0', fontSize:11, color:'#9ca3af', textAlign:'center' }}>~{PUBLISHER_RATE}đ per chapter read</p>
        </div>
      </div>

      {/* Earnings calculator */}
      <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:18, padding:28, marginBottom:36 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontSize:22 }}>😊</span>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>Earnings Estimator</h2>
        </div>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>
          Simple math: every chapter someone reads → you earn. A reader typically reads 6–36 chapters per story.
        </p>

        {/* Mode tabs */}
        <div style={{ display:'flex', background:'#fff', borderRadius:10, padding:3, marginBottom:20, border:'1px solid #e2e8f0' }}>
          {[['affiliate',`Affiliate (${AFFILIATE_RATE}đ/ch)`],['publisher',`Publisher (${PUBLISHER_RATE}đ/ch)`]].map(([k,l])=>(
            <button key={k} onClick={()=>setCalcMode(k)}
              style={{ flex:1, padding:'9px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:13, background:calcMode===k?'#6366f1':'transparent', color:calcMode===k?'#fff':'#6b7280' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Quick examples */}
        <div style={{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13 }}>
          <div style={{ fontWeight:700, color:'#374151', marginBottom:8 }}>If 1 person visits... you could earn:</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[6,12,36].map(n=>(
              <div key={n} style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#6366f1' }}>{(n*rate).toLocaleString()}đ</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>({n} chapters)</div>
              </div>
            ))}
          </div>
          <p style={{ margin:'8px 0 0', fontSize:11, color:'#9ca3af' }}>* Estimated. Real numbers shown in Dashboard after approval.</p>
        </div>

        {/* Slider */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>Number of readers</span>
              <span style={{ fontSize:13, fontWeight:800, color:'#6366f1' }}>{readers>=1000?readers/1000+'K':readers} readers</span>
            </div>
            <input type="range" min={10} max={100000} step={10} value={readers} onChange={e=>setReaders(+e.target.value)}
              style={{ width:'100%', accentColor:'#6366f1' }} />
            <p style={{ margin:'6px 0 0', fontSize:11, color:'#9ca3af' }}>Tip: posting in groups/pages can easily get hundreds to thousands of readers.</p>

            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>How many chapters does each reader read?</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {READ_RATES.map(r=>(
                  <button key={r.value} onClick={()=>setChapRead(r.value)}
                    style={{ padding:'7px 14px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700,
                      background: chapRead===r.value?'#6366f1':'#fff', color:chapRead===r.value?'#fff':'#6b7280', borderColor:chapRead===r.value?'#6366f1':'#e2e8f0' }}>
                    {r.label}
                  </button>
                ))}
              </div>
              <p style={{ margin:'6px 0 0', fontSize:11, color:'#9ca3af' }}>Note: good reviews + right-genre story = many more chapters read.</p>
            </div>
          </div>

          {/* Result */}
          <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:16, padding:24, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:12, color:'#c7d2fe', marginBottom:8 }}>Estimated earnings</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#fff', marginBottom:4 }}>{estimated.toLocaleString()}đ</div>
            <div style={{ fontSize:13, color:'#c7d2fe', marginBottom:16 }}>
              {readers.toLocaleString()} readers × {chapRead} chapters × {rate}đ/chapter
            </div>
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#e0e7ff' }}>
              Calculated as: {calcMode.charAt(0).toUpperCase()+calcMode.slice(1)}.<br/>
              You can switch to compare.
            </div>
          </div>
        </div>
      </div>

      {/* Apply form */}
      {(role || true) && !showForm && (
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <button onClick={()=>{ if(!auth?.user){onLoginRequest();return}; setShowForm(true) }}
            style={{ padding:'14px 40px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:14, fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 4px 20px rgba(99,102,241,0.35)' }}>
            Apply Now {role ? `as ${role.charAt(0).toUpperCase()+role.slice(1)}` : ''} →
          </button>
          {!auth?.user && <p style={{ margin:'8px 0 0', fontSize:12, color:'#9ca3af' }}>Sign in first to apply</p>}
        </div>
      )}

      {showForm && (
        <div style={{ background:'#fff', border:'1.5px solid #6366f1', borderRadius:18, padding:28, marginBottom:36 }}>
          <h3 style={{ margin:'0 0 20px', fontSize:17, fontWeight:800 }}>📝 Application Form</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Full Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={IS} placeholder="Your name" />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Email *</label>
                <input value={form.email||auth?.user?.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={IS} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>
                {role==='publisher' ? 'Your stories / portfolio' : 'Your channel / page / group link'}
              </label>
              <input value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))} style={IS}
                placeholder={role==='publisher'?'Link to your work or describe it...':'Facebook group, TikTok, YouTube...'} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Additional notes</label>
              <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={3}
                style={{ ...IS, resize:'vertical' }} placeholder="Tell us about yourself and why you want to join..." />
            </div>
            <button onClick={apply} disabled={applying||!form.name||!form.email}
              style={{ padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer', opacity:applying||!form.name||!form.email?0.6:1 }}>
              {applying ? 'Submitting...' : '🚀 Submit Application'}
            </button>
          </div>
        </div>
      )}

      {/* Trust signals */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:36 }}>
        {[
          { icon:'✅', title:'Transparent', desc:'Clear stats, easy to track.' },
          { icon:'⚡', title:'Easy to start', desc:'Choose role → submit form → get Dashboard.' },
          { icon:'🛡', title:'Reliable', desc:'Payment history, on-time payouts.' },
        ].map(s=>(
          <div key={s.title} style={{ textAlign:'center', padding:'20px 16px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:6 }}>{s.title}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
