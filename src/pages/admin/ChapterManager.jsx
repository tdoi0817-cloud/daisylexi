// src/pages/admin/ChapterManager.jsx — Chapter manager with text editor + AI
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStory, getChapters } from '../../lib/firestore'
import { createChapter, updateChapter, deleteChapter } from '../../lib/admin'

// ── Call Claude via Netlify proxy ─────────────────────────────────
async function callClaude(prompt, maxTokens = 800) {
  const res = await fetch('/.netlify/functions/claude-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: 'You are a creative story writer specializing in manga/webcomic narratives. Write engaging, cinematic prose.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  return d.content?.find(b => b.type === 'text')?.text?.trim() || ''
}

// ── Minimal toolbar for text editor ──────────────────────────────
function Toolbar({ onAction }) {
  const tools = [
    { l:'B',      title:'Bold',      fn:()=>onAction('**','**') },
    { l:'I',      title:'Italic',    fn:()=>onAction('*','*') },
    { l:'H2',     title:'Heading',   fn:()=>onAction('\n## ','') },
    { l:'"',      title:'Quote',     fn:()=>onAction('\n> ','') },
    { l:'—',      title:'Separator', fn:()=>onAction('\n---\n','') },
  ]
  return (
    <div style={{ display:'flex', gap:4, padding:'6px 8px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', flexWrap:'wrap' }}>
      {tools.map(t => (
        <button key={t.l} type="button" onClick={t.fn} title={t.title}
          style={{ padding:'4px 10px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', color:'#374151' }}>
          {t.l}
        </button>
      ))}
      <div style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center' }}>Markdown supported</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// CHAPTER FORM
// ══════════════════════════════════════════════════════════════════
function ChapterForm({ storyId, storyTitle, chapter, onClose, onSaved }) {
  const isEdit   = Boolean(chapter)
  const thumbRef = useRef()
  const pagesRef = useRef()
  const textRef  = useRef()

  const [form, setForm] = useState({
    title:    chapter?.title    || '',
    order:    chapter?.order    || 1,
    locked:   chapter?.locked   || false,
    coinCost: chapter?.coinCost || 5,
    content:  chapter?.content  || '',
  })
  const [contentMode, setContentMode] = useState(
    chapter?.content && chapter.content.trim().length > 10 ? 'text' : 'images'
  )
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPrev, setThumbPrev] = useState(chapter?.thumbnailUrl || '')
  const [pageFiles, setPageFiles] = useState([])
  const [pagePrevs, setPagePrevs] = useState(chapter?.imageUrls || [])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [aiLoading, setAiLoad]    = useState(false)
  const [aiAction,  setAiAction]  = useState('')
  const [wordCount, setWordCount] = useState((chapter?.content||'').split(/\s+/).filter(Boolean).length)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateContent = (v) => {
    set('content', v)
    setWordCount(v.split(/\s+/).filter(Boolean).length)
  }

  const toolbarAction = (before, after) => {
    const ta = textRef.current
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const sel = form.content.slice(start, end) || 'text'
    const newVal = form.content.slice(0, start) + before + sel + after + form.content.slice(end)
    updateContent(newVal)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + sel.length) }, 0)
  }

  const onThumb = e => { const f = e.target.files[0]; if (!f) return; setThumbFile(f); setThumbPrev(URL.createObjectURL(f)) }
  const onPages = e => { const files = Array.from(e.target.files); setPageFiles(files); setPagePrevs(files.map(f => URL.createObjectURL(f))) }

  // ── AI actions ────────────────────────────────────────────────
  const aiWrite = async (type) => {
    setAiLoad(true); setAiAction(type)
    try {
      let prompt = ''
      if (type === 'write') {
        prompt = `Write a compelling chapter for the story "${storyTitle||'this webcomic'}".
Chapter: "${form.title}"
${form.content ? 'Current draft (improve this): '+form.content.slice(0,300) : 'Write from scratch.'}
Style: manga/webcomic prose. Cinematic, vivid. Show don't tell. Include dialogue. 250-350 words.`
      } else if (type === 'improve') {
        if (!form.content.trim()) { setError('Write some content first, then use Improve.'); setAiLoad(false); return }
        prompt = `Improve this webcomic chapter content. Make it more vivid, cinematic, and engaging. Fix any awkward phrasing. Keep the same plot. Same approximate length.
Original: "${form.content}"`
      } else if (type === 'cliffhanger') {
        prompt = `Add a dramatic cliffhanger ending to this chapter. Keep the existing content, just add 2-3 sentences at the end that make readers desperate to read the next chapter.
Chapter content: "${form.content}"`
      } else if (type === 'continue') {
        prompt = `Continue this webcomic chapter with 150-200 more words. Keep the same tone and style. Raise the stakes or reveal something new.
Existing content: "${form.content.slice(-400)}"`
      }
      const result = await callClaude(prompt, 900)
      if (type === 'continue') {
        updateContent(form.content + '\n\n' + result)
      } else {
        updateContent(result)
      }
    } catch(e) { setError('AI error: ' + e.message) }
    finally { setAiLoad(false); setAiAction('') }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Please enter a chapter title.'); return }
    setError(''); setSaving(true)
    try {
      const data = { ...form }
      if (isEdit) await updateChapter(storyId, chapter.id, data, pageFiles, thumbFile)
      else        await createChapter(storyId, data, pageFiles, thumbFile)
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const iStyle = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ background:'#fff', border:'1.5px solid #c7d2fe', borderRadius:16, marginBottom:20, overflow:'hidden', boxShadow:'0 4px 20px rgba(99,102,241,0.1)' }}>
      {/* Form header */}
      <div style={{ background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#4c1d95' }}>
            {isEdit ? '✏️ Edit Chapter' : '＋ New Chapter'}
          </h3>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'#6d28d9' }}>{storyTitle}</p>
        </div>
        <button type="button" onClick={onClose}
          style={{ background:'rgba(255,255,255,0.5)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>
          ×
        </button>
      </div>

      <form onSubmit={handleSave} style={{ padding:20 }}>

        {/* Title + Order */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Chapter Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Chapter 1: The Beginning" required style={iStyle}
              onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Order</label>
            <input type="number" value={form.order} onChange={e => set('order', +e.target.value)} min={1} style={iStyle} />
          </div>
        </div>

        {/* Lock */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:'10px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <input type="checkbox" checked={form.locked} onChange={e => set('locked', e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            🔒 Lock chapter (require coins)
          </label>
          {form.locked && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
              <label style={{ fontSize:13, color:'#374151', fontWeight:600 }}>Price:</label>
              <input type="number" value={form.coinCost} onChange={e => set('coinCost', +e.target.value)}
                min={1} max={99} style={{ width:60, padding:'6px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, textAlign:'center', outline:'none' }} />
              <span style={{ fontSize:13, color:'#374151' }}>coins</span>
            </div>
          )}
        </div>

        {/* Content mode switcher */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:3, marginBottom:14 }}>
            <button type="button" onClick={() => setContentMode('text')}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, background:contentMode==='text'?'#fff':'transparent', color:contentMode==='text'?'#6366f1':'#6b7280', boxShadow:contentMode==='text'?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              📝 Text Content
            </button>
            <button type="button" onClick={() => setContentMode('images')}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, background:contentMode==='images'?'#fff':'transparent', color:contentMode==='images'?'#6366f1':'#6b7280', boxShadow:contentMode==='images'?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              🖼 Images / Pages
            </button>
          </div>

          {/* ── TEXT EDITOR ── */}
          {contentMode === 'text' && (
            <div>
              {/* AI toolbar */}
              <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280', fontWeight:600, alignSelf:'center' }}>AI Assist:</span>
                {[
                  { k:'write',       l:'✨ Write Chapter',   desc:'Write full chapter content' },
                  { k:'improve',     l:'🔧 Improve',         desc:'Make it better' },
                  { k:'continue',    l:'➕ Continue',         desc:'Add more content' },
                  { k:'cliffhanger', l:'🎯 Add Cliffhanger',  desc:'Add dramatic ending' },
                ].map(a => (
                  <button key={a.k} type="button" onClick={() => aiWrite(a.k)} disabled={aiLoading}
                    title={a.desc}
                    style={{ padding:'6px 12px', background: aiLoading&&aiAction===a.k?'#ddd6fe':'#ede9fe', border:'1.5px solid #c4b5fd', borderRadius:8, fontSize:12, fontWeight:700, color:'#6d28d9', cursor:aiLoading?'default':'pointer', display:'flex', alignItems:'center', gap:5, opacity:aiLoading&&aiAction!==a.k?0.5:1 }}>
                    {aiLoading && aiAction===a.k ? (
                      <><span style={{ width:10, height:10, border:'1.5px solid #6d28d9', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .6s linear infinite' }} />{a.l.split(' ')[0]}...</>
                    ) : a.l}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                <Toolbar onAction={toolbarAction} />
                <textarea
                  ref={textRef}
                  id="chapter-editor"
                  value={form.content}
                  onChange={e => updateContent(e.target.value)}
                  rows={16}
                  placeholder="Write your chapter content here...

You can use Markdown formatting:
**bold**, *italic*, ## Heading

Or use the AI buttons above to generate/improve content automatically."
                  style={{ width:'100%', padding:'16px', border:'none', outline:'none', fontSize:15, lineHeight:1.9, fontFamily:"Georgia, 'Times New Roman', serif", resize:'vertical', boxSizing:'border-box', color:'#1e293b', background:'#fff' }}
                />
              </div>

              {/* Word count + preview toggle */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'#9ca3af' }}>
                <span>{wordCount} words · {form.content.length} characters</span>
                <span>📖 Estimated read time: ~{Math.ceil(wordCount/200)} min</span>
              </div>

              {/* Live preview */}
              {form.content.trim().length > 20 && (
                <details style={{ marginTop:12 }}>
                  <summary style={{ cursor:'pointer', fontSize:12, fontWeight:700, color:'#6366f1', userSelect:'none', padding:'6px 0' }}>
                    👁 Preview rendered content
                  </summary>
                  <div style={{ marginTop:10, padding:'16px 20px', background:'#fafafa', borderRadius:10, border:'1px solid #f1f5f9', fontSize:15, lineHeight:1.9, fontFamily:"Georgia, serif", color:'#1e293b', whiteSpace:'pre-wrap' }}>
                    {form.content}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* ── IMAGE UPLOAD ── */}
          {contentMode === 'images' && (
            <div>
              {/* Thumbnail */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>Chapter Thumbnail</label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {thumbPrev
                    ? <img src={thumbPrev} alt="" style={{ width:60, height:60, borderRadius:8, objectFit:'cover', border:'1px solid #e2e8f0' }} />
                    : <div style={{ width:60, height:60, borderRadius:8, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🖼</div>
                  }
                  <button type="button" onClick={() => thumbRef.current.click()}
                    style={{ padding:'8px 16px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
                    📁 {thumbPrev ? 'Change thumbnail' : 'Upload thumbnail'}
                  </button>
                  <input ref={thumbRef} type="file" accept="image/*" onChange={onThumb} style={{ display:'none' }} />
                </div>
              </div>

              {/* Pages */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>
                  Manga Pages
                  {pageFiles.length > 0 && <span style={{ color:'#6366f1', marginLeft:6 }}>({pageFiles.length} selected)</span>}
                  {pagePrevs.length > 0 && pageFiles.length === 0 && <span style={{ color:'#16a34a', marginLeft:6 }}>({pagePrevs.length} existing)</span>}
                </label>

                <button type="button" onClick={() => pagesRef.current.click()}
                  style={{ padding:'14px', background:'#f8fafc', border:'2px dashed #d1d5db', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600, color:'#6b7280', width:'100%', textAlign:'center', marginBottom:10 }}>
                  📁 Click to select page images (multiple files supported)
                </button>
                <input ref={pagesRef} type="file" accept="image/*" multiple onChange={onPages} style={{ display:'none' }} />

                {pagePrevs.length > 0 && (
                  <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6 }}>
                    {pagePrevs.slice(0, 12).map((url, i) => (
                      <div key={i} style={{ flexShrink:0, position:'relative' }}>
                        <img src={url} alt="" style={{ width:56, height:78, borderRadius:7, objectFit:'cover', border:'1px solid #e2e8f0', display:'block' }} />
                        <div style={{ position:'absolute', bottom:2, right:2, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:4 }}>
                          {i+1}
                        </div>
                      </div>
                    ))}
                    {pagePrevs.length > 12 && (
                      <div style={{ width:56, height:78, borderRadius:7, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#6b7280', fontWeight:700, flexShrink:0 }}>
                        +{pagePrevs.length - 12}
                      </div>
                    )}
                  </div>
                )}

                <p style={{ margin:'8px 0 0', fontSize:11, color:'#9ca3af' }}>
                  💡 For many images, use <strong>Bulk Upload</strong> instead — it has drag & drop with ordering.
                  <Link to={`/admin/stories/${storyId}/bulk-upload`} style={{ color:'#6366f1', marginLeft:6 }}>Go to Bulk Upload →</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding:'10px 14px', background:'#fef2f2', color:'#ef4444', borderRadius:10, marginBottom:14, fontSize:13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Save / Cancel */}
        <div style={{ display:'flex', gap:10 }}>
          <button type="submit" disabled={saving}
            style={{ flex:1, padding:'12px', background:saving?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:saving?'default':'pointer' }}>
            {saving ? '⏳ Saving...' : `💾 Save Chapter`}
          </button>
          <button type="button" onClick={onClose}
            style={{ padding:'12px 20px', background:'#f1f5f9', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', color:'#374151' }}>
            Cancel
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// CHAPTER MANAGER (main)
// ══════════════════════════════════════════════════════════════════
export default function ChapterManager() {
  const { storyId } = useParams()
  const [story,    setStory]    = useState(null)
  const [chapters, setChaps]    = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editCh,   setEditCh]   = useState(null)

  const load = () => {
    getStory(storyId).then(s => { if (s) setStory(s) })
    getChapters(storyId).then(cs => setChaps(cs))
  }
  useEffect(load, [storyId])

  const handleDelete = async (chId, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    await deleteChapter(storyId, chId)
    setChaps(cs => cs.filter(c => c.id !== chId))
  }

  const openEdit = (ch) => { setEditCh(ch); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}) }
  const openNew  = ()   => { setEditCh(null); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}) }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Link to="/admin/stories" style={{ color:'#6b7280', textDecoration:'none', fontSize:20 }}>←</Link>
        <div style={{ flex:1 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>📖 {story?.title || 'Loading...'}</h2>
          <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>{chapters.length} chapters</p>
        </div>
        <Link to={`/admin/stories/${storyId}/bulk-upload`}
          style={{ padding:'9px 16px', background:'#f1f5f9', color:'#374151', textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:13 }}>
          📤 Bulk Upload
        </Link>
        <Link to={`/admin/stories/${storyId}/editor`}
          style={{ padding:'9px 16px', background:'#f1f5f9', color:'#374151', textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:13 }}>
          ⚙️ Story Settings
        </Link>
        <button onClick={openNew}
          style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:800, fontSize:14, cursor:'pointer' }}>
          ＋ New Chapter
        </button>
      </div>

      {/* Chapter form */}
      {showForm && (
        <ChapterForm
          storyId={storyId}
          storyTitle={story?.title}
          chapter={editCh}
          onClose={() => { setShowForm(false); setEditCh(null) }}
          onSaved={() => { setShowForm(false); setEditCh(null); load() }}
        />
      )}

      {/* Chapter list */}
      {chapters.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', background:'#fff', borderRadius:14, border:'1px solid #e8eaf0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          <h3 style={{ margin:'0 0 8px', fontWeight:800 }}>No chapters yet</h3>
          <p style={{ color:'#6b7280', fontSize:14, marginBottom:16 }}>Create your first chapter using text or upload manga images.</p>
          <button onClick={openNew}
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontWeight:800, fontSize:14, cursor:'pointer' }}>
            ＋ Create First Chapter
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
          {chapters.map((ch, i) => (
            <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:i<chapters.length-1?'1px solid #f1f5f9':'none', transition:'background .1s' }}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>

              {/* Thumbnail */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={ch.thumbnailUrl || `https://picsum.photos/seed/${ch.id}/80/80`} alt=""
                  style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'1px solid #e2e8f0' }} />
                {ch.locked && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔒</div>}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#1e293b' }}>{ch.title}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:3, display:'flex', gap:10, flexWrap:'wrap' }}>
                  {(ch.imageUrls||[]).length > 0 && <span>🖼 {ch.imageUrls.length} pages</span>}
                  {ch.content?.trim().length > 0 && <span>📝 {ch.content.split(/\s+/).filter(Boolean).length} words</span>}
                  {ch.locked ? <span style={{ color:'#f59e0b' }}>🔒 {ch.coinCost} coins</span>
                             : <span style={{ color:'#16a34a' }}>✓ Free</span>}
                  <span>👁 {ch.views||0} views</span>
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => openEdit(ch)}
                  style={{ fontSize:12, color:'#6366f1', fontWeight:700, background:'#ede9fe', padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(ch.id, ch.title)}
                  style={{ fontSize:12, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'7px 12px', borderRadius:8, border:'none', cursor:'pointer' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
