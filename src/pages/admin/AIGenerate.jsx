// src/pages/admin/AIGenerate.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

const BULK_GENRES = [
  {id:'romance',  label:'Romance',       tone:'forbidden love, shocking betrayal, secret identity',        emoji:'💔'},
  {id:'action',   label:'Action',        tone:'assassin, hidden past, explosive life-or-death moment',     emoji:'⚔️'},
  {id:'mystery',  label:'Mystery',       tone:'unreliable narrator, disturbing discovery, paranoia',       emoji:'🔍'},
  {id:'fantasy',  label:'Fantasy',       tone:'forbidden prophecy, ancient power awakens, sacrifice',      emoji:'🐉'},
  {id:'horror',   label:'Horror',        tone:'psychological dread, entity in the house, dark past',       emoji:'👁️'},
  {id:'scifi',    label:'Sci-Fi',        tone:'memory implant, AI rebellion, identity crisis',             emoji:'🚀'},
  {id:'thriller', label:'Thriller',      tone:'hunted, no one to trust, deadly secret',                    emoji:'🔪'},
  {id:'sol',      label:'Slice of Life', tone:'bittersweet loss, unexpected bond, quiet devastating truth', emoji:'🌸'},
  {id:'super',    label:'Supernatural',  tone:'dark deal, soul debt, possession creeping in',              emoji:'👻'},
  {id:'drama',    label:'Drama',         tone:'family secret exposed, inheritance war, hidden child',      emoji:'🎭'},
]
const SINGLE_GENRES = ['Romance','Action','Mystery','Fantasy','Horror','Sci-Fi','Thriller','Slice of Life','Supernatural','Drama']
const TONES = ['Dark & Dramatic','Sweet & Wholesome','Action-Packed','Mysterious','Comedic','Bittersweet']

async function callClaude(prompt) {
  const res = await fetch('/.netlify/functions/claude-proxy', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: 'You are a master story writer. Use ONLY the XML tags requested. No JSON. No markdown. No extra text.',
      messages: [{role:'user', content:prompt}],
    }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error))
  return d.content?.find(b => b.type==='text')?.text || ''
}

function x(text, tag) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ''
}

async function genStory(genre, tone) {
  const meta = await callClaude(
`Create a ${genre} story. Tone: ${tone}.
Return ONLY these XML tags:
<title>3-6 word gripping title</title>
<tagline>hook sentence max 12 words</tagline>
<desc>2 sentences: shocking setup then burning question.</desc>
<author>creative pen name</author>
<g2>second genre</g2>
<c1>Chapter 1: subtitle</c1>
<c2>Chapter 2: subtitle</c2>
<c3>Chapter 3: subtitle</c3>
<c4>Chapter 4: subtitle</c4>
<c5>Chapter 5: subtitle</c5>`)

  const title = x(meta,'title') || genre+' Story'
  const ch1raw = await callClaude(
`Write Chapter 1 of "${title}" (${genre}). Tone: ${tone}.
Start mid-action. First sentence = shocking crisis. Include dialogue. End on cliffhanger. Max 180 words.
Return ONLY: <content>text here</content>`)

  return {
    meta: { title, tagline:x(meta,'tagline'), desc:x(meta,'desc'), author:x(meta,'author')||'Readunlocked', g2:x(meta,'g2') },
    chapters: [
      {title:x(meta,'c1')||'Chapter 1', order:1, locked:false, coinCost:0, content:x(ch1raw,'content')},
      {title:x(meta,'c2')||'Chapter 2', order:2, locked:false, coinCost:0, content:''},
      {title:x(meta,'c3')||'Chapter 3', order:3, locked:true,  coinCost:5, content:''},
      {title:x(meta,'c4')||'Chapter 4', order:4, locked:true,  coinCost:5, content:''},
      {title:x(meta,'c5')||'Chapter 5', order:5, locked:true,  coinCost:8, content:''},
    ]
  }
}

async function saveToDb(meta, chapters, genre, seed) {
  const ts  = serverTimestamp()
  const ref = await addDoc(collection(db,'stories'), {
    title:meta.title, tagline:meta.tagline, description:meta.desc,
    author:meta.author, genres:[genre,meta.g2].filter(Boolean),
    status:'Ongoing', coverUrl:`https://picsum.photos/seed/${seed}/400/560`,
    views:0, likes:0, rating:4.5, team:'Readunlocked',
    createdAt:ts, updatedAt:ts,
  })
  for (const ch of chapters) {
    const pages = [0,1,2,3].map(j=>`https://picsum.photos/seed/${seed}${ch.order}${j}/800/1200`)
    await addDoc(collection(db,'stories',ref.id,'chapters'), {
      title:ch.title, order:ch.order, locked:ch.locked, coinCost:ch.coinCost,
      content:ch.content||'', imageUrls:pages, thumbnailUrl:pages[0],
      views:0, readTime:5, createdAt:ts, updatedAt:ts,
    })
  }
  return ref.id
}

const SS = {
  idle:    {bg:'#f1f5f9',color:'#6b7280'},
  running: {bg:'#ede9fe',color:'#6d28d9'},
  saving:  {bg:'#fef3c7',color:'#92400e'},
  saved:   {bg:'#dcfce7',color:'#166534'},
  error:   {bg:'#fef2f2',color:'#ef4444'},
}

export default function AIGenerate() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('bulk')

  // Bulk
  const [items, setItems] = useState(BULK_GENRES.map(g=>({...g,status:'idle',result:null,sid:null,err:null})))
  const [running, setRunning] = useState(false)
  const stopFlag = {v:false}

  const upd = (i,p) => setItems(prev=>prev.map((x,idx)=>idx===i?{...x,...p}:x))

  const runBulk = async () => {
    setRunning(true); stopFlag.v=false
    for (let i=0;i<BULK_GENRES.length;i++) {
      if(stopFlag.v) break
      const g=BULK_GENRES[i]
      upd(i,{status:'running',err:null})
      try {
        const {meta,chapters}=await genStory(g.label,g.tone)
        upd(i,{status:'saving',result:{meta,chapters}})
        const sid=await saveToDb(meta,chapters,g.label,g.id+i)
        upd(i,{status:'saved',sid})
      } catch(e) { upd(i,{status:'error',err:e.message.slice(0,80)}) }
      await new Promise(r=>setTimeout(r,800))
    }
    setRunning(false)
  }

  // Single
  const [sf,setSf]=useState({genre:'Romance',tone:'Dark & Dramatic',kw:''})
  const [sr,setSr]=useState(null)
  const [sl,setSl]=useState(false)
  const [se,setSe]=useState('')

  const runSingle=async()=>{
    setSe('');setSl(true);setSr(null)
    try{const r=await genStory(sf.genre,sf.tone+(sf.kw?', '+sf.kw:''));setSr(r)}
    catch(e){setSe(e.message)}finally{setSl(false)}
  }
  const saveSingle=async()=>{
    if(!sr)return;setSl(true)
    try{const sid=await saveToDb(sr.meta,sr.chapters,sf.genre,'s'+Date.now()%1000);navigate(`/admin/stories/${sid}/edit`)}
    catch(e){setSe(e.message)}finally{setSl(false)}
  }

  const done=items.filter(s=>['saving','saved'].includes(s.status)).length
  const saved=items.filter(s=>s.status==='saved').length
  const IS={width:'100%',padding:'9px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}

  return (
    <AdminGuard require="ctv">
      <div style={{maxWidth:700}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:800}}>🤖 AI Story Generator</h2>
        <p style={{margin:'0 0 18px',fontSize:13,color:'#6b7280'}}>Powered by Claude AI via Netlify Functions</p>

        {/* Tabs */}
        <div style={{display:'flex',background:'#f1f5f9',borderRadius:12,padding:3,marginBottom:20}}>
          {[['bulk','⚡ Bulk — 10 Stories'],['single','✏️ Custom — 1 Story']].map(([k,l])=>(
            <button key={k} onClick={()=>setMode(k)}
              style={{flex:1,padding:'10px',border:'none',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:13,background:mode===k?'#fff':'transparent',color:mode===k?'#6366f1':'#6b7280',boxShadow:mode===k?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── BULK ── */}
        {mode==='bulk'&&(
          <div>
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#166534'}}>
              ✅ Generates & publishes all 10 stories directly to Firestore in one click. Each has 2 free + 3 locked chapters.
            </div>
            <div style={{display:'flex',gap:10,marginBottom:16}}>
              <button onClick={runBulk} disabled={running}
                style={{flex:1,padding:'13px',background:running?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:14,cursor:running?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {running?(<><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .6s linear infinite'}}/>Generating... ({done}/10)</>)
                :saved===10?'🔄 Re-generate All':'⚡ Generate & Publish All 10'}
              </button>
              {running&&<button onClick={()=>{stopFlag.v=true;setRunning(false)}} style={{padding:'13px 16px',background:'#fef2f2',color:'#ef4444',border:'1.5px solid #fecaca',borderRadius:12,fontWeight:800,fontSize:13,cursor:'pointer'}}>⏹ Stop</button>}
            </div>

            {done>0&&(
              <div style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginBottom:5}}>
                  <span>{saved} published · {done} processed</span><span>{Math.round(done/10*100)}%</span>
                </div>
                <div style={{height:6,background:'#e2e8f0',borderRadius:99}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:99,width:`${done/10*100}%`,transition:'width .5s'}}/>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {items.map((item,i)=>{
                const st=SS[item.status]||SS.idle
                return(
                  <div key={item.id} style={{background:'#fff',border:`1.5px solid ${item.status==='saved'?'#bbf7d0':item.status==='error'?'#fecaca':'#e2e8f0'}`,borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:20,flexShrink:0}}>{item.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.result?.meta?.title||item.label}</div>
                      {item.result?.meta?.tagline&&<div style={{fontSize:11,color:'#6b7280',fontStyle:'italic',marginTop:1}}>"{item.result.meta.tagline}"</div>}
                      {item.err&&<div style={{fontSize:11,color:'#ef4444',marginTop:1}}>⚠️ {item.err}</div>}
                    </div>
                    <div style={{display:'flex',gap:7,flexShrink:0,alignItems:'center'}}>
                      {item.sid&&<button onClick={()=>navigate(`/truyen/${item.sid}`)} style={{fontSize:11,color:'#6366f1',background:'#ede9fe',border:'none',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontWeight:700}}>View →</button>}
                      <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,background:st.bg,color:st.color,display:'flex',alignItems:'center',gap:5}}>
                        {(item.status==='running'||item.status==='saving')&&<span style={{width:10,height:10,border:`1.5px solid ${st.color}`,borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .6s linear infinite'}}/>}
                        {item.status==='saved'?'✓ Published':item.status==='saving'?'Saving...':item.status==='running'?'Generating...':item.status==='error'?'Error':'Waiting'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {saved===10&&(
              <div style={{marginTop:16,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #86efac',borderRadius:14,padding:'18px 20px',textAlign:'center'}}>
                <div style={{fontSize:30,marginBottom:6}}>🎉</div>
                <div style={{fontWeight:800,fontSize:16,color:'#166534',marginBottom:4}}>All 10 Stories Published!</div>
                <button onClick={()=>navigate('/')} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontWeight:800,fontSize:14,cursor:'pointer',marginTop:8}}>View Homepage →</button>
              </div>
            )}
          </div>
        )}

        {/* ── SINGLE ── */}
        {mode==='single'&&(
          <div>
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',padding:20,marginBottom:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Genre</label>
                  <select value={sf.genre} onChange={e=>setSf(f=>({...f,genre:e.target.value}))} style={IS}>{SINGLE_GENRES.map(g=><option key={g}>{g}</option>)}</select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Tone</label>
                  <select value={sf.tone} onChange={e=>setSf(f=>({...f,tone:e.target.value}))} style={IS}>{TONES.map(t=><option key={t}>{t}</option>)}</select>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Keywords (optional)</label>
                <input value={sf.kw} onChange={e=>setSf(f=>({...f,kw:e.target.value}))} placeholder="e.g. reincarnation, revenge, hidden identity..." style={IS}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
            </div>
            <button onClick={runSingle} disabled={sl} style={{width:'100%',padding:'13px',background:sl?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:14,cursor:sl?'default':'pointer',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {sl&&!sr?<><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .6s linear infinite'}}/>Generating...</>:'✨ Generate Story'}
            </button>
            {se&&<div style={{padding:'10px 14px',background:'#fef2f2',color:'#ef4444',borderRadius:10,marginBottom:14,fontSize:13}}>{se}</div>}
            {sr&&(
              <div style={{background:'#fff',borderRadius:14,border:'1.5px solid #c4b5fd',overflow:'hidden'}}>
                <div style={{padding:'14px 18px',background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <h3 style={{margin:0,fontSize:15,fontWeight:800,color:'#4c1d95'}}>✅ Generated!</h3>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={runSingle} disabled={sl} style={{padding:'6px 14px',background:'#fff',border:'1.5px solid #c4b5fd',borderRadius:8,fontSize:12,fontWeight:700,color:'#6d28d9',cursor:'pointer'}}>🔄 Redo</button>
                    <button onClick={saveSingle} disabled={sl} style={{padding:'6px 14px',background:'#6366f1',border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer'}}>{sl?'Saving...':'💾 Save & Edit'}</button>
                  </div>
                </div>
                <div style={{padding:18}}>
                  <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{sr.meta.title}</div>
                  {sr.meta.tagline&&<div style={{fontSize:13,color:'#6b7280',fontStyle:'italic',marginBottom:12}}>"{sr.meta.tagline}"</div>}
                  <p style={{fontSize:13,color:'#374151',lineHeight:1.7,marginBottom:14,background:'#f8fafc',padding:'12px 14px',borderRadius:10}}>{sr.meta.desc}</p>
                  {sr.chapters[0]?.content&&(
                    <div style={{padding:'12px 14px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9'}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#9ca3af',letterSpacing:1,marginBottom:8}}>CHAPTER 1 OPENING</div>
                      <p style={{fontSize:13,color:'#374151',lineHeight:1.8,margin:0}}>{sr.chapters[0].content}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Setup note */}
        <div style={{marginTop:18,padding:'14px 16px',background:'#fef9ec',border:'1px solid #fde68a',borderRadius:12}}>
          <p style={{margin:'0 0 6px',fontSize:13,fontWeight:800,color:'#92400e'}}>⚙️ Netlify env var required</p>
          <p style={{margin:0,fontSize:12,color:'#92400e',lineHeight:1.7}}>
            Netlify Dashboard → Site settings → Environment variables → Add:<br/>
            <code style={{background:'rgba(0,0,0,.08)',padding:'1px 5px',borderRadius:4}}>CLAUDE_API_KEY</code> = your Claude API key (sk-ant-...)<br/>
            Then <strong>Trigger redeploy</strong> for the function to activate.
          </p>
        </div>
      </div>
    </AdminGuard>
  )
}
