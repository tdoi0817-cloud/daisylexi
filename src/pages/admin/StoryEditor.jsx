// src/pages/admin/StoryEditor.jsx
// Full story editor: text editing, SEO scoring, tags, meta, AI assist, fake views, author
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { uploadImage } from '../../lib/admin'
import AdminGuard from '../../components/admin/AdminGuard'

const GENRES_LIST = ['Romance','Action','Mystery','Fantasy','Horror','Sci-Fi','Thriller','Slice of Life','Supernatural','Drama','Comedy','Historical','Sports','Isekai','Mecha']
const STATUS_LIST = ['Ongoing','Completed','Hiatus','Coming Soon']

// ── Call Claude via Netlify proxy ────────────────────────────────
async function callClaude(prompt, maxTokens = 600) {
  const res = await fetch('/.netlify/functions/claude-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: 'You are an expert SEO content writer and story editor. Be concise and practical.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  return d.content?.find(b => b.type === 'text')?.text?.trim() || ''
}

// ── SEO Scorer (like RankMath) ───────────────────────────────────
function calcSEOScore(form) {
  const checks = []
  const title     = form.title || ''
  const desc      = form.metaDescription || form.description || ''
  const kw        = (form.focusKeyword || '').toLowerCase()
  const tags      = form.tags || []

  // Title checks
  checks.push({ label:'Title length (50-60 chars)',   pass: title.length >= 40 && title.length <= 70,    weight:10 })
  checks.push({ label:'Focus keyword in title',        pass: kw && title.toLowerCase().includes(kw),      weight:15 })
  checks.push({ label:'Title is set',                  pass: title.length > 0,                             weight:5  })

  // Meta description
  checks.push({ label:'Meta description (120-160 chars)', pass: desc.length >= 100 && desc.length <= 170, weight:15 })
  checks.push({ label:'Keyword in meta description',      pass: kw && desc.toLowerCase().includes(kw),    weight:10 })
  checks.push({ label:'Meta description is set',          pass: desc.length > 0,                           weight:5  })

  // Content
  checks.push({ label:'Description has 100+ chars',   pass: (form.description||'').length >= 100,         weight:10 })
  checks.push({ label:'Tags added (3+)',               pass: tags.length >= 3,                              weight:10 })
  checks.push({ label:'Cover image set',               pass: !!(form.coverUrl),                             weight:10 })
  checks.push({ label:'Genre/category selected',       pass: (form.genres||[]).length > 0,                 weight:5  })
  checks.push({ label:'Author name set',               pass: !!(form.author),                               weight:5  })

  const maxScore = checks.reduce((a,c) => a + c.weight, 0)
  const score    = checks.filter(c => c.pass).reduce((a,c) => a + c.weight, 0)
  const pct      = Math.round(score / maxScore * 100)

  let color = '#ef4444'; let label = 'Needs Work'
  if (pct >= 80) { color = '#16a34a'; label = 'Good' }
  else if (pct >= 60) { color = '#f59e0b'; label = 'Okay' }
  else if (pct >= 40) { color = '#f97316'; label = 'Fair' }

  return { score: pct, color, label, checks }
}

// ── Tag input component ──────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = (tag) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g,'-')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  const remove = (t) => onChange(tags.filter(x => x !== t))
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        {tags.map(t => (
          <span key={t} style={{ display:'flex', alignItems:'center', gap:4, background:'#ede9fe', color:'#6d28d9', fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
            #{t}
            <button onClick={() => remove(t)} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:14, lineHeight:1, padding:'0 0 0 2px' }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
          placeholder="Type tag and press Enter..."
          style={{ flex:1, padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit' }}
          onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
        <button onClick={() => add(input)}
          style={{ padding:'8px 14px', background:'#6366f1', color:'#fff', border:'none', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + Add
        </button>
      </div>
      <p style={{ margin:'5px 0 0', fontSize:11, color:'#9ca3af' }}>Press Enter or comma to add • Click × to remove</p>
    </div>
  )
}

// ── SEO Score panel (like RankMath) ─────────────────────────────
function SEOPanel({ seo, form, onSetField }) {
  const [expanded, setExpanded] = useState(false)
  const getColor = (pass) => pass ? '#16a34a' : '#ef4444'

  return (
    <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
      <div onClick={() => setExpanded(e => !e)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer', background: seo.score>=80?'#f0fdf4':seo.score>=60?'#fef9ec':'#fef2f2' }}>
        {/* Donut score */}
        <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="#e2e8f0" strokeWidth="5"/>
            <circle cx="26" cy="26" r="22" fill="none" stroke={seo.color} strokeWidth="5"
              strokeDasharray={`${seo.score * 1.38} 138`} strokeLinecap="round"
              transform="rotate(-90 26 26)" style={{ transition:'stroke-dasharray 0.5s' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:seo.color }}>{seo.score}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>SEO Score: <span style={{ color:seo.color }}>{seo.label}</span></div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{seo.score}/100 · {seo.checks.filter(c=>c.pass).length}/{seo.checks.length} checks passed</div>
        </div>
        <span style={{ fontSize:18, color:'#9ca3af', transform:expanded?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▾</span>
      </div>

      {expanded && (
        <div style={{ padding:'14px 16px', borderTop:'1px solid #f1f5f9' }}>
          {/* Focus keyword */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Focus Keyword</label>
            <input value={form.focusKeyword||''} onChange={e => onSetField('focusKeyword', e.target.value)}
              placeholder="e.g. romance manga, fantasy webcomic..."
              style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          </div>
          {/* Checklist */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {seo.checks.map((ch, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{ch.pass ? '✅' : '❌'}</span>
                <span style={{ color: ch.pass ? '#374151' : '#9ca3af', flex:1 }}>{ch.label}</span>
                <span style={{ fontSize:10, fontWeight:700, color:getColor(ch.pass) }}>{ch.weight}pt</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function StoryEditor() {
  const { storyId } = useParams()
  const navigate    = useNavigate()
  const coverRef    = useRef()

  const [form, setForm] = useState({
    title:'', description:'', author:'', team:'Readunlocked',
    status:'Ongoing', genres:[], coverUrl:'',
    tags:[], focusKeyword:'', metaDescription:'',
    views:0, likes:0, fakeViews:0,
  })
  const [chapters,    setChapters]    = useState([])
  const [activeTab,   setActiveTab]   = useState('basic')
  const [coverFile,   setCoverFile]   = useState(null)
  const [coverPrev,   setCoverPrev]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [aiLoading,   setAiLoading]   = useState({})
  const [toast,       setToast]       = useState('')
  const [progress,    setProgress]    = useState(0)

  const seo = calcSEOScore(form)
  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const showToast = (msg, ms=3000) => { setToast(msg); setTimeout(()=>setToast(''), ms) }

  useEffect(() => {
    if (!storyId) return
    getDoc(doc(db,'stories',storyId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setForm({ title:'', description:'', author:'', team:'Readunlocked', status:'Ongoing', genres:[], coverUrl:'', tags:[], focusKeyword:'', metaDescription:'', views:0, likes:0, fakeViews:0, ...d })
        setCoverPrev(d.coverUrl||'')
      }
    })
    getDocs(query(collection(db,'stories',storyId,'chapters'), orderBy('order','asc')))
      .then(snap => setChapters(snap.docs.map(d=>({id:d.id,...d.data()}))))
  }, [storyId])

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPrev(URL.createObjectURL(f))
  }

  const save = async () => {
    setSaving(true)
    try {
      let coverUrl = form.coverUrl
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, `stories/covers/${storyId}_${Date.now()}`, p => setProgress(p))
      }
      const totalViews = (form.views||0) + (form.fakeViews||0)
      await updateDoc(doc(db,'stories',storyId), {
        title:          form.title,
        description:    form.description,
        author:         form.author,
        team:           form.team,
        status:         form.status,
        genres:         form.genres,
        coverUrl,
        tags:           form.tags,
        focusKeyword:   form.focusKeyword,
        metaDescription:form.metaDescription,
        views:          totalViews,
        fakeViews:      form.fakeViews||0,
        seoScore:       seo.score,
        updatedAt:      serverTimestamp(),
      })
      set('coverUrl', coverUrl)
      setCoverFile(null)
      showToast('✅ Saved successfully!')
    } catch(e) { showToast('❌ Error: '+e.message) }
    finally { setSaving(false); setProgress(0) }
  }

  // ── AI helpers ───────────────────────────────────────────────────
  const aiRun = async (key, fn) => {
    setAiLoading(l => ({...l,[key]:true}))
    try { await fn() }
    catch(e) { showToast('❌ AI error: '+e.message) }
    finally { setAiLoading(l => ({...l,[key]:false})) }
  }

  const aiGenerateTags = () => aiRun('tags', async () => {
    const raw = await callClaude(
      `Story: "${form.title}". Genre: ${form.genres.join(', ')}. Description: ${form.description?.slice(0,200)}.
Generate 8-12 SEO tags for this webcomic. Tags should be: genre terms, plot themes, keywords readers search.
Return ONLY a comma-separated list of tags, no explanation. Example: romance,forbidden-love,enemies-to-lovers`
    )
    const newTags = raw.split(',').map(t=>t.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')).filter(Boolean)
    set('tags', [...new Set([...form.tags, ...newTags])])
    showToast(`✨ Added ${newTags.length} AI tags!`)
  })

  const aiGenerateMeta = () => aiRun('meta', async () => {
    const raw = await callClaude(
      `Write a meta description for this webcomic for Google search results.
Title: "${form.title}"
Genre: ${form.genres.join(', ')}
Description: ${form.description?.slice(0,300)}
Focus keyword: ${form.focusKeyword || form.genres[0] || 'webcomic'}

Rules: 140-160 characters. Include focus keyword naturally. Create urgency/curiosity. End with a CTA.
Return ONLY the meta description text, nothing else.`
    , 300)
    set('metaDescription', raw.slice(0,160))
    showToast('✨ Meta description generated!')
  })

  const aiImproveDescription = () => aiRun('desc', async () => {
    const raw = await callClaude(
      `Improve this webcomic description for maximum reader engagement and SEO:
Current: "${form.description}"
Genre: ${form.genres.join(', ')}
Focus keyword: ${form.focusKeyword || ''}

Rules: 3 paragraphs. Para 1: hook the reader in the first sentence. Para 2: escalate the stakes. Para 3: end with a question that makes them need to read it. Include focus keyword naturally. 150-200 words total.
Return ONLY the improved description, no explanation.`
    , 500)
    set('description', raw)
    showToast('✨ Description improved!')
  })

  const aiSuggestTitle = () => aiRun('title', async () => {
    const raw = await callClaude(
      `Suggest 5 compelling title alternatives for this ${form.genres.join('/')} story.
Current title: "${form.title}"
Description: ${form.description?.slice(0,200)}

Rules: Each title 3-7 words. Intriguing, marketable globally. SEO-friendly.
Return ONLY the 5 titles, one per line, numbered.`
    , 200)
    const titles = raw.split('\n').filter(l=>l.trim()).slice(0,5)
    showToast('💡 Suggestions: ' + titles.join(' | '), 8000)
  })

  const IS = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const TABS = [
    { k:'basic',   l:'📝 Basic Info' },
    { k:'seo',     l:'🔍 SEO' },
    { k:'chapters',l:`📚 Chapters (${chapters.length})` },
    { k:'stats',   l:'📊 Stats' },
  ]

  if (!storyId) return <div style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>No story selected.</div>

  return (
    <AdminGuard require="ctv">
      <div style={{ maxWidth:800 }}>
        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1e293b', color:'#fff', padding:'10px 24px', borderRadius:30, fontSize:13, fontWeight:700, zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,0.25)', whiteSpace:'nowrap' }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <Link to="/admin/stories" style={{ color:'#6b7280', textDecoration:'none', fontSize:20 }}>←</Link>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>✏️ Story Editor</h2>
            <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>{form.title || 'Untitled'}</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* SEO mini badge */}
            <div style={{ padding:'5px 12px', background:seo.color+'20', border:`1.5px solid ${seo.color}40`, borderRadius:20, fontSize:12, fontWeight:700, color:seo.color }}>
              SEO {seo.score}/100
            </div>
            <a href={`/truyen/${storyId}`} target="_blank" rel="noreferrer"
              style={{ padding:'9px 16px', background:'#f1f5f9', color:'#374151', textDecoration:'none', borderRadius:10, fontSize:13, fontWeight:600 }}>
              👁 Preview
            </a>
            <button onClick={save} disabled={saving}
              style={{ padding:'9px 20px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:13, cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}>
              {saving ? `Saving ${progress}%...` : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:3, marginBottom:20, overflowX:'auto' }}>
          {TABS.map(({k,l}) => (
            <button key={k} onClick={()=>setActiveTab(k)}
              style={{ flex:1, minWidth:100, padding:'9px 8px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:12, whiteSpace:'nowrap', background:activeTab===k?'#fff':'transparent', color:activeTab===k?'#6366f1':'#6b7280', boxShadow:activeTab===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO TAB ── */}
        {activeTab === 'basic' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Cover + Title row */}
            <div style={{ display:'flex', gap:16, background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18, flexWrap:'wrap' }}>
              {/* Cover */}
              <div style={{ flexShrink:0 }}>
                <div style={{ position:'relative', width:120, height:168, borderRadius:12, overflow:'hidden', background:'#f1f5f9', border:'2px dashed #e2e8f0', cursor:'pointer' }}
                  onClick={() => coverRef.current?.click()}>
                  {coverPrev
                    ? <img src={coverPrev} alt="Cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', gap:6 }}><span style={{ fontSize:28 }}>🖼</span><span style={{ fontSize:11 }}>Click to upload</span></div>
                  }
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
                    onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0'}>
                    <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>Change Cover</span>
                  </div>
                </div>
                <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display:'none' }} />
                {coverFile && <div style={{ fontSize:10, color:'#6366f1', marginTop:4, textAlign:'center', fontWeight:600 }}>✓ New cover ready</div>}
              </div>

              {/* Title + Author + Status */}
              <div style={{ flex:1, minWidth:200, display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#374151' }}>Title *</label>
                    <button onClick={aiSuggestTitle} disabled={aiLoading.title}
                      style={{ fontSize:10, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontWeight:700 }}>
                      {aiLoading.title ? '...' : '✨ AI Suggest'}
                    </button>
                  </div>
                  <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Story title" style={IS} />
                  <div style={{ fontSize:10, color: form.title.length>70?'#ef4444':'#9ca3af', marginTop:3, textAlign:'right' }}>{form.title.length}/70</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Author</label>
                    <input value={form.author||''} onChange={e=>set('author',e.target.value)} placeholder="Author name" style={IS} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Translation Team</label>
                    <input value={form.team||''} onChange={e=>set('team',e.target.value)} placeholder="Team name" style={IS} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Status</label>
                  <select value={form.status} onChange={e=>set('status',e.target.value)} style={IS}>
                    {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:10 }}>Genres / Categories</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {GENRES_LIST.map(g => (
                  <button key={g} onClick={() => set('genres', form.genres.includes(g) ? form.genres.filter(x=>x!==g) : [...form.genres,g])}
                    style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.15s',
                      background:   form.genres.includes(g) ? '#6366f1' : '#fff',
                      color:        form.genres.includes(g) ? '#fff'    : '#6b7280',
                      borderColor:  form.genres.includes(g) ? '#6366f1' : '#e2e8f0' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Description</label>
                <button onClick={aiImproveDescription} disabled={aiLoading.desc}
                  style={{ fontSize:11, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                  {aiLoading.desc ? '⏳ Improving...' : '✨ AI Improve'}
                </button>
              </div>
              <textarea value={form.description||''} onChange={e=>set('description',e.target.value)}
                rows={6} placeholder="Story description..."
                style={{ ...IS, resize:'vertical', lineHeight:1.6 }} />
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:4, textAlign:'right' }}>{(form.description||'').length} chars</div>
            </div>

            {/* Tags */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Tags</label>
                <button onClick={aiGenerateTags} disabled={aiLoading.tags}
                  style={{ fontSize:11, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontWeight:700 }}>
                  {aiLoading.tags ? '⏳ Generating...' : '🏷️ AI Auto-tag'}
                </button>
              </div>
              <TagInput tags={form.tags||[]} onChange={tags=>set('tags',tags)} />
            </div>
          </div>
        )}

        {/* ── SEO TAB ── */}
        {activeTab === 'seo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SEOPanel seo={seo} form={form} onSetField={set} />

            {/* Meta description */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block' }}>Meta Description</label>
                  <span style={{ fontSize:11, color:'#9ca3af' }}>Shown in Google search results</span>
                </div>
                <button onClick={aiGenerateMeta} disabled={aiLoading.meta}
                  style={{ fontSize:11, color:'#16a34a', background:'#dcfce7', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontWeight:700 }}>
                  {aiLoading.meta ? '⏳ Writing...' : '🤖 AI Write Meta'}
                </button>
              </div>
              <textarea value={form.metaDescription||''} onChange={e=>set('metaDescription',e.target.value.slice(0,160))}
                rows={3} placeholder="Write a compelling meta description for Google (140-160 chars)..."
                style={{ ...IS, resize:'none' }} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:10, color:'#9ca3af' }}>Target: 140-160 characters</span>
                <span style={{ fontSize:10, color:(form.metaDescription||'').length>=140&&(form.metaDescription||'').length<=160?'#16a34a':'#f59e0b', fontWeight:700 }}>
                  {(form.metaDescription||'').length}/160
                </span>
              </div>
            </div>

            {/* Google Preview */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:12 }}>🔍 Google Search Preview</label>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'16px 20px', fontFamily:'Arial, sans-serif' }}>
                <div style={{ fontSize:12, color:'#006621', marginBottom:2 }}>readunlocked.com › truyen › {storyId}</div>
                <div style={{ fontSize:18, color:'#1a0dab', marginBottom:4, cursor:'pointer', textDecoration:'underline' }}>
                  {form.title || 'Story Title'} | Readunlocked
                </div>
                <div style={{ fontSize:14, color:'#545454', lineHeight:1.5 }}>
                  {form.metaDescription || form.description?.slice(0,160) || 'No meta description set. Add one above for better Google rankings.'}
                </div>
              </div>
            </div>

            {/* Social preview */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:12 }}>📱 Social Share Preview</label>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', maxWidth:500 }}>
                {coverPrev && <img src={coverPrev} alt="" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />}
                <div style={{ padding:'12px 14px', background:'#f8fafc' }}>
                  <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>READUNLOCKED.COM</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', marginBottom:4 }}>{form.title || 'Story Title'}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{(form.metaDescription||form.description||'').slice(0,100)}...</div>
                </div>
              </div>
            </div>

            {/* Tags for SEO */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>SEO Tags</label>
                <button onClick={aiGenerateTags} disabled={aiLoading.tags}
                  style={{ fontSize:11, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontWeight:700 }}>
                  {aiLoading.tags ? '...' : '✨ Auto-generate'}
                </button>
              </div>
              <TagInput tags={form.tags||[]} onChange={tags=>set('tags',tags)} />
            </div>
          </div>
        )}

        {/* ── CHAPTERS TAB ── */}
        {activeTab === 'chapters' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <Link to={`/admin/stories/${storyId}/bulk-upload`}
                style={{ flex:1, textAlign:'center', padding:'11px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', textDecoration:'none', borderRadius:12, fontWeight:800, fontSize:14 }}>
                📤 Bulk Upload Images
              </Link>
            </div>
            {chapters.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af', background:'#f8fafc', borderRadius:12 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                <p>No chapters yet. Use Bulk Upload to add images.</p>
              </div>
            ) : chapters.map((ch, i) => (
              <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#fff', border:'1px solid #e8eaf0', borderRadius:12, marginBottom:8 }}>
                {ch.thumbnailUrl && <img src={ch.thumbnailUrl} alt="" style={{ width:44, height:60, borderRadius:8, objectFit:'cover', flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{ch.title}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                    {ch.locked ? `🔒 ${ch.coinCost} coins` : '✓ Free'} · {ch.imageUrls?.length||0} pages · 👁 {ch.views||0}
                  </div>
                </div>
                <Link to={`/admin/stories/${storyId}/chapters`}
                  style={{ fontSize:11, color:'#6366f1', background:'#ede9fe', border:'none', borderRadius:8, padding:'5px 12px', textDecoration:'none', fontWeight:700 }}>
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Real stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { l:'Real Views',   v:form.views||0,         i:'👁',  bg:'#ede9fe', c:'#6d28d9' },
                { l:'Fake Views',   v:form.fakeViews||0,     i:'🎭', bg:'#fef9ec', c:'#92400e' },
                { l:'Total Shown',  v:(form.views||0)+(form.fakeViews||0), i:'📊', bg:'#dcfce7', c:'#166534' },
                { l:'Likes',        v:form.likes||0,         i:'❤️',  bg:'#fef2f2', c:'#ef4444' },
                { l:'Chapters',     v:chapters.length,       i:'📚', bg:'#f0f9ff', c:'#0369a1' },
                { l:'SEO Score',    v:seo.score+'%',         i:'🔍', bg:seo.score>=80?'#dcfce7':seo.score>=60?'#fef9ec':'#fef2f2', c:seo.color },
              ].map(s=>(
                <div key={s.l} style={{ background:s.bg, borderRadius:12, padding:'14px 12px' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{s.i}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11, color:s.c, opacity:0.8 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Fake views editor */}
            <div style={{ background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, padding:18 }}>
              <h3 style={{ margin:'0 0 6px', fontSize:14, fontWeight:800 }}>🎭 View Booster</h3>
              <p style={{ margin:'0 0 14px', fontSize:12, color:'#6b7280' }}>Add fake views to make your story look more popular to new readers. These are added on top of real views.</p>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                <input type="number" value={form.fakeViews||0} onChange={e=>set('fakeViews',Math.max(0,+e.target.value))}
                  min={0} max={9999999}
                  style={{ flex:1, padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none' }} />
                <span style={{ fontSize:13, color:'#6b7280', whiteSpace:'nowrap' }}>fake views</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[100,500,1000,5000,10000,50000].map(n=>(
                  <button key={n} onClick={()=>set('fakeViews',(form.fakeViews||0)+n)}
                    style={{ padding:'6px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                    +{n>=1000?n/1000+'K':n}
                  </button>
                ))}
                <button onClick={()=>set('fakeViews',0)}
                  style={{ padding:'6px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#ef4444' }}>
                  Reset
                </button>
              </div>
              <p style={{ margin:'10px 0 0', fontSize:11, color:'#9ca3af' }}>
                Displayed: {((form.views||0)+(form.fakeViews||0)).toLocaleString()} views total
              </p>
            </div>
          </div>
        )}

        {/* Bottom save bar */}
        <div style={{ marginTop:20, display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Link to="/admin/stories" style={{ padding:'11px 20px', background:'#f1f5f9', color:'#374151', textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:14 }}>
            Cancel
          </Link>
          <button onClick={save} disabled={saving}
            style={{ padding:'11px 28px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}>
            {saving ? `Saving ${progress}%...` : '💾 Save All Changes'}
          </button>
        </div>
      </div>
    </AdminGuard>
  )
}
