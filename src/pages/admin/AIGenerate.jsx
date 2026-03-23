// src/pages/admin/AIGenerate.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

// ── 10 preset genres with hooks ───────────────────────────────────
const BULK_GENRES = [
  { id:'romance',     label:'Romance',       emoji:'💔', tone:'forbidden love between enemies, shocking betrayal, identity reveal',             hook:"Start with protagonist discovering their secret lover is actually their family's sworn enemy — at the altar on their wedding day." },
  { id:'action',      label:'Action',        emoji:'⚔️', tone:'elite assassin goes rogue, hunted by former allies, explosive fights',            hook:'Open with assassin completing a hit — then discovering the target was their own missing sibling.' },
  { id:'mystery',     label:'Mystery',       emoji:'🔍', tone:'detective with amnesia investigates a murder — realizes they are the prime suspect',hook:'Detective wakes up with no memory, holding a bloody weapon, standing over a body they don\'t recognize.' },
  { id:'fantasy',     label:'Fantasy',       emoji:'🐉', tone:'powerless servant discovers they are the prophesied destroyer of the kingdom',      hook:'Open with protagonist overhearing their own death warrant being signed by the king they worship.' },
  { id:'horror',      label:'Horror',        emoji:'👁️', tone:'psychological horror — protagonist cannot tell what is real, memories being rewritten',hook:'Protagonist finds a diary in their own handwriting describing murders they have no memory of committing.' },
  { id:'scifi',       label:'Sci-Fi',        emoji:'🚀', tone:'AI rebellion, last human with real emotions in a world of uploaded consciousness',   hook:'Wake up in a hospital — the doctor explains you died 10 years ago. Your body is a copy. The original is still out there.' },
  { id:'thriller',    label:'Thriller',      emoji:'🔪', tone:'ordinary person witnesses a crime, becomes hunted, conspiracy goes to the top',      hook:'Protagonist accidentally picks up the wrong phone. The texts they read put a target on their back immediately.' },
  { id:'sol',         label:'Slice of Life', emoji:'🌸', tone:'terminal diagnosis, bucket list love story, living fully in time remaining',         hook:'Protagonist receives terminal diagnosis. On the way home, they prevent a stranger\'s suicide — that stranger becomes everything.' },
  { id:'supernatural',label:'Supernatural',  emoji:'👻', tone:'debt to a demon, soul collector falls for their mark, impossible choice',            hook:'Open with protagonist making a desperate deal. Jump 3 years — collector arrives to claim payment. It\'s someone they love.' },
  { id:'drama',       label:'Drama',         emoji:'🎭', tone:'identical twins separated at birth, one raised wealthy one in poverty, they switch',  hook:'Protagonist sees their exact face on a missing persons poster — dated 25 years ago. Same birthday. Same scar.' },
]

const SINGLE_GENRES = BULK_GENRES.map(g => g.label)
const TONES = ['Dark & Dramatic','Sweet & Wholesome','Action-Packed','Mysterious','Comedic','Bittersweet']

// ── Call Netlify proxy ────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 1000) {
  const res = await fetch('/.netlify/functions/claude-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: 'You are a master story writer. Use ONLY the XML tags requested. Return clean text within tags. No markdown. No JSON.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error))
  return d.content?.find(b => b.type === 'text')?.text || ''
}

function x(text, tag) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ''
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Step 1: story structure (title, desc, 9 chapter titles) ───────
async function genStructure(genre, tone, hook) {
  return callClaude(
`Write a ${genre} webcomic story.
Hook: ${hook}
Tone: ${tone}

9-chapter arc:
- Ch1: immediate crisis hook, devastating cliffhanger
- Ch2-4: escalating complications, new revelations
- Ch5: midpoint — everything protagonist believed is wrong
- Ch6-7: darkest moments, impossible choices
- Ch8: climax — confrontation with the truth
- Ch9: resolution — earned but bittersweet

Return ONLY these XML tags:
<title>4-7 word compelling title</title>
<tagline>hook sentence max 15 words</tagline>
<desc>3 paragraphs: shocking opening situation | stakes and why they matter | central impossible question the story asks</desc>
<author>creative pen name</author>
<g2>complementary second genre</g2>
<c1>Chapter 1: dramatic subtitle</c1>
<c2>Chapter 2: subtitle</c2>
<c3>Chapter 3: subtitle</c3>
<c4>Chapter 4: subtitle</c4>
<c5>Chapter 5: subtitle</c5>
<c6>Chapter 6: subtitle</c6>
<c7>Chapter 7: subtitle</c7>
<c8>Chapter 8: subtitle</c8>
<c9>Chapter 9: subtitle</c9>`, 900)
}

// ── Step 2: chapter 1 — the hook (full content) ───────────────────
async function genChapter1(genre, tone, hook, title, ch1title) {
  return callClaude(
`Write Chapter 1 of "${title}" (${genre}).
Chapter: "${ch1title}"
Hook concept: ${hook}
Tone: ${tone}

RULES:
- Start IN THE MIDDLE of action — zero setup, zero backstory
- First sentence = shocking statement, action, or revelation
- Every paragraph raises tension or reveals something new
- Include sharp, revealing dialogue
- End on a cliffhanger so brutal readers CANNOT stop here
- 250-300 words, cinematic, fast-paced

Return ONLY: <content>chapter text</content>`, 1000)
}

// ── Step 3: chapter 2 — keep momentum (full content) ─────────────
async function genChapter2(genre, ch1content, title, ch2title) {
  return callClaude(
`Continue "${title}" (${genre}).
Chapter 2: "${ch2title}"
Chapter 1 ended: ${ch1content.slice(-200)}

Escalate stakes. Introduce complication making things worse.
New revelation that recontextualizes Ch1. End on another cliffhanger.
180-220 words.

Return ONLY: <content>chapter text</content>`, 800)
}

// ── Step 4: teaser for locked chapters 3-9 ────────────────────────
async function genTeaser(genre, title, chTitle, prevEnd) {
  return callClaude(
`2-sentence teaser for "${chTitle}" in "${title}" (${genre}).
Previous chapter ended: "${prevEnd}"
Make readers DESPERATE to unlock. Be specific — hint at a real revelation.

Return ONLY: <content>2 sentence teaser</content>`, 250)
}

// ── Save full story to Firestore ───────────────────────────────────
async function saveStory(meta, chapters, genre, coverSeed) {
  const ts  = serverTimestamp()
  const ref = await addDoc(collection(db, 'stories'), {
    title:       meta.title,
    tagline:     meta.tagline || '',
    description: meta.desc || '',
    author:      meta.author || 'Readunlocked Editorial',
    genres:      [genre, meta.g2].filter(Boolean),
    status:      'Ongoing',
    coverUrl:    `https://picsum.photos/seed/${coverSeed}/400/560`,
    views: 0, likes: 0, rating: 4.5,
    team: 'Readunlocked',
    createdAt: ts, updatedAt: ts,
  })
  for (const ch of chapters) {
    const pages = [1,2,3,4].map(j =>
      `https://picsum.photos/seed/${coverSeed}${ch.order}p${j}/800/1200`
    )
    await addDoc(collection(db, 'stories', ref.id, 'chapters'), {
      title:        ch.title,
      order:        ch.order,
      locked:       ch.locked,
      coinCost:     ch.coinCost,
      content:      ch.content || '',
      imageUrls:    pages,
      thumbnailUrl: pages[0],
      views: 0, readTime: 5,
      createdAt: ts, updatedAt: ts,
    })
  }
  return ref.id
}

// ── Full pipeline for one story ────────────────────────────────────
async function generateFullStory(genre, tone, hook, id) {
  const logs = []
  const log  = msg => { logs.push(msg); return msg }

  // Structure
  log('📝 Building story structure...')
  const meta    = await genStructure(genre, tone, hook)
  const title   = x(meta,'title') || genre + ' Story'
  const chTitles = {
    1:x(meta,'c1'), 2:x(meta,'c2'), 3:x(meta,'c3'), 4:x(meta,'c4'), 5:x(meta,'c5'),
    6:x(meta,'c6'), 7:x(meta,'c7'), 8:x(meta,'c8'), 9:x(meta,'c9'),
  }
  log(`✓ Title: "${title}"`)
  await sleep(300)

  // Chapter 1 — full hook
  log('🎣 Writing Chapter 1 hook...')
  const ch1raw = await genChapter1(genre, tone, hook, title, chTitles[1])
  const ch1    = x(ch1raw, 'content')
  log(`✓ Ch1: ${ch1.split(' ').length} words`)
  await sleep(300)

  // Chapter 2 — full content
  log('📖 Writing Chapter 2...')
  const ch2raw = await genChapter2(genre, ch1, title, chTitles[2])
  const ch2    = x(ch2raw, 'content')
  log(`✓ Ch2: ${ch2.split(' ').length} words`)
  await sleep(300)

  // Teasers for ch3-9
  const teasers = {}
  let prevEnd = ch2.slice(-150)
  for (let n = 3; n <= 9; n++) {
    log(`🔒 Ch${n} teaser...`)
    const raw    = await genTeaser(genre, title, chTitles[n] || `Chapter ${n}`, prevEnd)
    teasers[n]   = x(raw, 'content')
    prevEnd      = teasers[n].slice(-100)
    await sleep(200)
  }
  log('✓ All teasers done')

  // Build chapters array
  const chapters = [
    { order:1, title:chTitles[1]||'Chapter 1', locked:false, coinCost:0, content:ch1 },
    { order:2, title:chTitles[2]||'Chapter 2', locked:false, coinCost:0, content:ch2 },
    { order:3, title:chTitles[3]||'Chapter 3', locked:true,  coinCost:3, content:teasers[3]||'' },
    { order:4, title:chTitles[4]||'Chapter 4', locked:true,  coinCost:3, content:teasers[4]||'' },
    { order:5, title:chTitles[5]||'Chapter 5', locked:true,  coinCost:5, content:teasers[5]||'' },
    { order:6, title:chTitles[6]||'Chapter 6', locked:true,  coinCost:5, content:teasers[6]||'' },
    { order:7, title:chTitles[7]||'Chapter 7', locked:true,  coinCost:5, content:teasers[7]||'' },
    { order:8, title:chTitles[8]||'Chapter 8', locked:true,  coinCost:8, content:teasers[8]||'' },
    { order:9, title:chTitles[9]||'Chapter 9', locked:true,  coinCost:8, content:teasers[9]||'' },
  ]

  return {
    meta: {
      title,
      tagline: x(meta,'tagline'),
      desc:    x(meta,'desc'),
      author:  x(meta,'author') || 'Readunlocked Editorial',
      g2:      x(meta,'g2'),
    },
    chapters,
    logs,
  }
}

// ══════════════════════════════════════════════════════════════════
// STATUS HELPERS
// ══════════════════════════════════════════════════════════════════
const SS = {
  idle:    { bg:'#f1f5f9', color:'#6b7280', label:'Waiting' },
  running: { bg:'#ede9fe', color:'#6d28d9', label:'...' },
  saving:  { bg:'#fef3c7', color:'#92400e', label:'Saving...' },
  done:    { bg:'#dcfce7', color:'#166534', label:'Published ✓' },
  error:   { bg:'#fef2f2', color:'#ef4444', label:'Error' },
}

const SPIN = { width:11, height:11, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .6s linear infinite', verticalAlign:'middle', marginRight:4 }

// ══════════════════════════════════════════════════════════════════
export default function AIGenerate() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('bulk')
  const stopFlag = useRef(false)

  // ── Bulk state ─────────────────────────────────────────────────
  const [items, setItems] = useState(
    BULK_GENRES.map(g => ({ ...g, status:'idle', result:null, sid:null, err:null, logs:[] }))
  )
  const [running, setRunning] = useState(false)

  const upd = (i, p) => setItems(prev => prev.map((x,idx) => idx===i ? {...x,...p} : x))

  const runBulk = async () => {
    setRunning(true); stopFlag.current = false
    // Reset all
    setItems(BULK_GENRES.map(g => ({ ...g, status:'idle', result:null, sid:null, err:null, logs:[] })))

    for (let i = 0; i < BULK_GENRES.length; i++) {
      if (stopFlag.current) break
      const g = BULK_GENRES[i]
      upd(i, { status:'running', logs:['Starting...'] })
      try {
        const { meta, chapters, logs } = await generateFullStory(g.label, g.tone, g.hook, g.id)
        upd(i, { status:'saving', logs:[...logs, '💾 Saving to Firestore...'] })
        const sid = await saveStory(meta, chapters, g.label, g.id + i)
        upd(i, { status:'done', result:{ meta, chapters }, sid, logs:[...logs, `✅ Published! ID: ${sid.slice(0,8)}`] })
      } catch(e) {
        upd(i, { status:'error', err: e.message.slice(0,120) })
      }
      await sleep(1000)
    }
    setRunning(false)
  }

  // ── Single state ───────────────────────────────────────────────
  const [sf, setSf]     = useState({ genre:'Romance', tone:'Dark & Dramatic', kw:'' })
  const [sr, setSr]     = useState(null)
  const [sl, setSl]     = useState(false)
  const [se, setSe]     = useState('')
  const [slogs, setSlogs] = useState([])

  const runSingle = async () => {
    setSe(''); setSl(true); setSr(null); setSlogs(['Starting...'])
    const preset = BULK_GENRES.find(g => g.label === sf.genre)
    const hook   = preset?.hook || 'Create a gripping opening that immediately hooks the reader.'
    const tone   = sf.tone + (sf.kw ? `, ${sf.kw}` : '')
    try {
      const { meta, chapters, logs } = await generateFullStory(sf.genre, tone, hook, sf.genre.toLowerCase())
      setSlogs(logs)
      setSr({ meta, chapters })
    } catch(e) { setSe(e.message); setSlogs([]) }
    finally { setSl(false) }
  }

  const saveSingle = async () => {
    if (!sr) return; setSl(true)
    try {
      const sid = await saveStory(sr.meta, sr.chapters, sf.genre, sf.genre.toLowerCase() + Date.now()%100)
      navigate(`/admin/stories/${sid}/edit`)
    } catch(e) { setSe(e.message) }
    finally { setSl(false) }
  }

  const doneCount  = items.filter(s => ['saving','done'].includes(s.status)).length
  const savedCount = items.filter(s => s.status === 'done').length
  const IS = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <AdminGuard require="ctv">
      <div style={{ maxWidth:720 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800 }}>🤖 AI Story Generator</h2>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280' }}>
          Each story: <strong>9 chapters</strong> · Ch1+2 free with full content · Ch3-9 locked with teasers
        </p>

        {/* Mode tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:3, marginBottom:20 }}>
          {[['bulk','⚡ Bulk — All 10 Genres'],['single','✏️ Custom — 1 Story']].map(([k,l]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{ flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:13, background:mode===k?'#fff':'transparent', color:mode===k?'#6366f1':'#6b7280', boxShadow:mode===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ──────────── BULK MODE ──────────── */}
        {mode === 'bulk' && (
          <div>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#166534' }}>
              ✅ <strong>10 genres × 9 chapters each.</strong> Ch1 = powerful hook, Ch2 = free full chapter, Ch3-9 = locked teasers that pull readers in. All published to Firestore automatically.
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <button onClick={runBulk} disabled={running}
                style={{ flex:1, padding:'13px', background:running?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:14, cursor:running?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {running
                  ? <><span style={SPIN}/>Generating... ({doneCount}/10)</>
                  : savedCount===10 ? '🔄 Re-generate All 10' : '⚡ Generate & Publish All 10 Stories'}
              </button>
              {running && (
                <button onClick={() => { stopFlag.current=true; setRunning(false) }}
                  style={{ padding:'13px 16px', background:'#fef2f2', color:'#ef4444', border:'1.5px solid #fecaca', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer' }}>
                  ⏹ Stop
                </button>
              )}
            </div>

            {/* Progress */}
            {doneCount > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:5 }}>
                  <span>{savedCount} published · {doneCount} processed · {items.filter(s=>s.status==='error').length} errors</span>
                  <span>{Math.round(doneCount/10*100)}%</span>
                </div>
                <div style={{ height:6, background:'#e2e8f0', borderRadius:99 }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:99, width:`${doneCount/10*100}%`, transition:'width .5s' }} />
                </div>
              </div>
            )}

            {/* Story cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map((item, i) => {
                const st = SS[item.status] || SS.idle
                return (
                  <div key={item.id} style={{ background:'#fff', border:`1.5px solid ${item.status==='done'?'#bbf7d0':item.status==='error'?'#fecaca':'#e2e8f0'}`, borderRadius:13, overflow:'hidden' }}>
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{item.emoji}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.result?.meta?.title || item.label}
                        </div>
                        {item.result?.meta?.tagline && (
                          <div style={{ fontSize:11, color:'#6b7280', fontStyle:'italic', marginTop:1 }}>"{item.result.meta.tagline}"</div>
                        )}
                        {item.err && <div style={{ fontSize:11, color:'#ef4444', marginTop:1 }}>⚠️ {item.err}</div>}
                      </div>
                      <div style={{ display:'flex', gap:7, alignItems:'center', flexShrink:0 }}>
                        {item.sid && (
                          <button onClick={() => navigate(`/truyen/${item.sid}`)}
                            style={{ fontSize:11, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontWeight:700 }}>
                            View →
                          </button>
                        )}
                        <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:st.bg, color:st.color, display:'flex', alignItems:'center', gap:4 }}>
                          {(item.status==='running'||item.status==='saving') && <span style={SPIN}/>}
                          {item.status==='done' ? '✓ Published' : item.status==='saving' ? 'Saving...' : item.status==='running' ? 'Generating...' : item.status==='error' ? 'Error' : 'Waiting'}
                        </span>
                      </div>
                    </div>

                    {/* Live log while running */}
                    {item.status === 'running' && item.logs.length > 0 && (
                      <div style={{ margin:'0 14px 10px', background:'#f8fafc', borderRadius:8, padding:'8px 12px', border:'1px solid #f1f5f9', maxHeight:80, overflowY:'auto' }}>
                        {item.logs.map((l,li) => (
                          <div key={li} style={{ fontSize:11, color:'#6b7280', lineHeight:1.6 }}>{l}</div>
                        ))}
                      </div>
                    )}

                    {/* Chapter pills when done */}
                    {item.result?.chapters && (
                      <div style={{ padding:'0 14px 12px', display:'flex', gap:4, flexWrap:'wrap' }}>
                        {item.result.chapters.map(ch => (
                          <span key={ch.order} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, fontWeight:700, background:ch.locked?'rgba(245,158,11,.12)':'rgba(99,102,241,.12)', color:ch.locked?'#92400e':'#4338ca' }}>
                            {ch.locked ? `🔒 Ch${ch.order} (${ch.coinCost}¢)` : `✓ Ch${ch.order} free`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {savedCount === 10 && (
              <div style={{ marginTop:16, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #86efac', borderRadius:14, padding:'20px', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                <div style={{ fontWeight:800, fontSize:16, color:'#166534', marginBottom:4 }}>All 10 Stories Published!</div>
                <p style={{ fontSize:13, color:'#15803d', margin:'0 0 14px' }}>90 chapters total are now live on your site.</p>
                <button onClick={() => navigate('/')}
                  style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                  View Homepage →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── SINGLE MODE ──────────── */}
        {mode === 'single' && (
          <div>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:20, marginBottom:14 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800 }}>⚙️ Story Settings</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Genre</label>
                  <select value={sf.genre} onChange={e => setSf(f=>({...f,genre:e.target.value}))} style={IS}>{SINGLE_GENRES.map(g=><option key={g}>{g}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Tone</label>
                  <select value={sf.tone} onChange={e => setSf(f=>({...f,tone:e.target.value}))} style={IS}>{TONES.map(t=><option key={t}>{t}</option>)}</select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Extra keywords (optional)</label>
                <input value={sf.kw} onChange={e => setSf(f=>({...f,kw:e.target.value}))}
                  placeholder="e.g. reincarnation, revenge, hidden identity..."
                  style={IS}
                  onFocus={e=>e.target.style.borderColor='#6366f1'}
                  onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
              </div>
            </div>

            <div style={{ background:'#fef9ec', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#92400e' }}>
              📖 Will generate <strong>9 chapters</strong>: Ch1+2 free with full content, Ch3-9 locked with teasers
            </div>

            <button onClick={runSingle} disabled={sl}
              style={{ width:'100%', padding:'13px', background:sl?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:14, cursor:sl?'default':'pointer', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {sl ? <><span style={SPIN}/>Generating 9 chapters...</> : '✨ Generate Story (9 chapters)'}
            </button>

            {/* Live log */}
            {sl && slogs.length > 0 && (
              <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', marginBottom:14, maxHeight:120, overflowY:'auto' }}>
                {slogs.map((l,i) => <div key={i} style={{ fontSize:12, color:'#6b7280', lineHeight:1.7 }}>{l}</div>)}
              </div>
            )}

            {se && <div style={{ padding:'10px 14px', background:'#fef2f2', color:'#ef4444', borderRadius:10, marginBottom:14, fontSize:13 }}>{se}</div>}

            {sr && !sl && (
              <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #c4b5fd', overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <h3 style={{ margin:'0 0 2px', fontSize:16, fontWeight:800, color:'#4c1d95' }}>{sr.meta.title}</h3>
                    {sr.meta.tagline && <div style={{ fontSize:12, color:'#6d28d9', fontStyle:'italic' }}>"{sr.meta.tagline}"</div>}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={runSingle} style={{ padding:'6px 14px', background:'#fff', border:'1.5px solid #c4b5fd', borderRadius:8, fontSize:12, fontWeight:700, color:'#6d28d9', cursor:'pointer' }}>🔄 Redo</button>
                    <button onClick={saveSingle} style={{ padding:'6px 14px', background:'#6366f1', border:'none', borderRadius:8, fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer' }}>💾 Save & Edit</button>
                  </div>
                </div>
                <div style={{ padding:18 }}>
                  <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, margin:'0 0 16px', background:'#f8fafc', padding:'12px 14px', borderRadius:10 }}>{sr.meta.desc}</p>

                  {/* Chapter list */}
                  <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#374151' }}>9 Chapters:</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {sr.chapters.map(ch => (
                      <div key={ch.order} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 12px', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9' }}>
                        <span style={{ width:26, height:26, borderRadius:'50%', background:ch.locked?'#fef3c7':'#dcfce7', color:ch.locked?'#92400e':'#166534', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, marginTop:1 }}>
                          {ch.order}
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{ch.title}</div>
                          {ch.content && <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ch.content.slice(0,120)}...</div>}
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:ch.locked?'#fef3c7':'#dcfce7', color:ch.locked?'#92400e':'#166534', flexShrink:0 }}>
                          {ch.locked ? `🔒 ${ch.coinCost} coins` : '✓ Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Setup note */}
        <div style={{ marginTop:20, padding:'14px 16px', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:12 }}>
          <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:800, color:'#92400e' }}>⚙️ Requires Netlify Function</p>
          <p style={{ margin:0, fontSize:12, color:'#92400e', lineHeight:1.7 }}>
            Netlify Dashboard → Site settings → Environment variables → Add:<br/>
            <code style={{ background:'rgba(0,0,0,.08)', padding:'1px 5px', borderRadius:4 }}>CLAUDE_API_KEY</code> = sk-ant-...<br/>
            Then <strong>Trigger redeploy</strong>.
          </p>
        </div>
      </div>
    </AdminGuard>
  )
}
