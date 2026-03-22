// src/pages/admin/ChapterManager.jsx — Upload chương + thumbnail
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStory, getChapters } from '../../lib/firestore'
import { createChapter, updateChapter, deleteChapter } from '../../lib/admin'

export default function ChapterManager() {
  const { storyId } = useParams()
  const [story, setStory]       = useState(null)
  const [chapters, setChaps]    = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editCh, setEditCh]     = useState(null)

  const load = () => {
    getStory(storyId).then(s => { if (s) setStory(s) })
    getChapters(storyId).then(cs => setChaps(cs))
  }
  useEffect(load, [storyId])

  const handleDelete = async (chId, title) => {
    if (!window.confirm(`Xoá "${title}"?`)) return
    await deleteChapter(storyId, chId)
    setChaps(cs => cs.filter(c => c.id !== chId))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Link to="/admin/stories" style={{ color:'#6b7280', textDecoration:'none', fontSize:18 }}>←</Link>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>📖 Chương: {story?.title || '...'}</h2>
          <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>{chapters.length} chương</p>
        </div>
        <button onClick={() => { setEditCh(null); setShowForm(true) }}
          style={{ marginLeft:'auto', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          ＋ Thêm chương
        </button>
      </div>

      {/* Chapter form */}
      {showForm && (
        <ChapterForm storyId={storyId} chapter={editCh}
          onClose={() => { setShowForm(false); setEditCh(null) }}
          onSaved={() => { setShowForm(false); setEditCh(null); load() }} />
      )}

      {/* Chapter list */}
      {chapters.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', background:'#fff', borderRadius:14, border:'1px solid #e8eaf0' }}>
          <p style={{ color:'#6b7280' }}>Chưa có chương nào.</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
          {chapters.map((ch, i) => (
            <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<chapters.length-1?'1px solid #f1f5f9':'none' }}>
              {/* Thumbnail */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={ch.thumbnailUrl || `https://picsum.photos/seed/${ch.id}/80/80`} alt=""
                  style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'1px solid #e2e8f0' }} />
                {ch.locked && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔒</div>}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{ch.title}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:2, display:'flex', gap:10 }}>
                  <span>📄 {(ch.imageUrls||[]).length} trang</span>
                  {ch.locked && <span style={{ color:'#f59e0b' }}>🔒 {ch.coinCost} xu</span>}
                  {!ch.locked && <span style={{ color:'#16a34a' }}>✓ Miễn phí</span>}
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => { setEditCh(ch); setShowForm(true) }}
                  style={{ fontSize:12, color:'#6366f1', fontWeight:700, background:'#ede9fe', padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer' }}>
                  Sửa
                </button>
                <button onClick={() => handleDelete(ch.id, ch.title)}
                  style={{ fontSize:12, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer' }}>
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Chapter form (inline) ────────────────────────────────────────
function ChapterForm({ storyId, chapter, onClose, onSaved }) {
  const isEdit    = Boolean(chapter)
  const thumbRef  = useRef()
  const pagesRef  = useRef()

  const [form, setForm] = useState({
    title:    chapter?.title    || '',
    order:    chapter?.order    || 1,
    locked:   chapter?.locked   || false,
    coinCost: chapter?.coinCost || 5,
  })
  const [thumbFile, setThumbFile]   = useState(null)
  const [thumbPrev, setThumbPrev]   = useState(chapter?.thumbnailUrl || '')
  const [pageFiles, setPageFiles]   = useState([])
  const [pagePrevs, setPagePrevs]   = useState(chapter?.imageUrls || [])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const set = (k,v) => setForm(f => ({...f, [k]:v}))

  const onThumb = (e) => {
    const f = e.target.files[0]; if (!f) return
    setThumbFile(f); setThumbPrev(URL.createObjectURL(f))
  }
  const onPages = (e) => {
    const files = Array.from(e.target.files)
    setPageFiles(files)
    setPagePrevs(files.map(f => URL.createObjectURL(f)))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Nhập tiêu đề chương.'); return }
    setError(''); setSaving(true)
    try {
      if (isEdit) await updateChapter(storyId, chapter.id, form, pageFiles, thumbFile)
      else        await createChapter(storyId, form, pageFiles, thumbFile)
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const iStyle = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ background:'#f0f4ff', border:'1.5px solid #c7d2fe', borderRadius:14, padding:20, marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{isEdit?'✏️ Sửa chương':'＋ Thêm chương mới'}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#6b7280' }}>✕</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Tiêu đề *</label>
            <input value={form.title} onChange={e => set('title',e.target.value)} placeholder="Chương 1: Khởi đầu" required style={iStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Thứ tự</label>
            <input type="number" value={form.order} onChange={e => set('order', +e.target.value)} min={1} style={iStyle} />
          </div>
        </div>

        {/* Lock settings */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14, padding:'10px 14px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <input type="checkbox" checked={form.locked} onChange={e => set('locked', e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            🔒 Khoá chapter (trả xu)
          </label>
          {form.locked && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Giá xu:</label>
              <input type="number" value={form.coinCost} onChange={e => set('coinCost', +e.target.value)} min={1} max={99}
                style={{ width:60, padding:'6px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, textAlign:'center', outline:'none' }} />
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>Ảnh thumbnail chương</label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {thumbPrev && <img src={thumbPrev} alt="" style={{ width:64, height:64, borderRadius:8, objectFit:'cover', border:'1px solid #e2e8f0' }} />}
            <button type="button" onClick={() => thumbRef.current.click()}
              style={{ padding:'8px 16px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
              📁 {thumbPrev ? 'Đổi thumbnail' : 'Chọn thumbnail'}
            </button>
            <input ref={thumbRef} type="file" accept="image/*" onChange={onThumb} style={{ display:'none' }} />
          </div>
        </div>

        {/* Pages */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>
            Ảnh trang truyện {pageFiles.length > 0 && <span style={{ color:'#6366f1' }}>({pageFiles.length} file đã chọn)</span>}
          </label>
          <button type="button" onClick={() => pagesRef.current.click()}
            style={{ padding:'8px 16px', background:'#fff', border:'1.5px dashed #d1d5db', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', width:'100%', textAlign:'center' }}>
            📁 Chọn ảnh trang (có thể chọn nhiều file)
          </button>
          <input ref={pagesRef} type="file" accept="image/*" multiple onChange={onPages} style={{ display:'none' }} />
          {pagePrevs.length > 0 && (
            <div style={{ display:'flex', gap:6, overflowX:'auto', marginTop:10, paddingBottom:4 }}>
              {pagePrevs.slice(0,8).map((url,i) => (
                <img key={i} src={url} alt="" style={{ width:50, height:70, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid #e2e8f0' }} />
              ))}
              {pagePrevs.length > 8 && <div style={{ width:50, height:70, borderRadius:6, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#6b7280', fontWeight:700, flexShrink:0 }}>+{pagePrevs.length-8}</div>}
            </div>
          )}
        </div>

        {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:10 }}>{error}</p>}

        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" disabled={saving}
            style={{ background: saving?'#a5b4fc':'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontWeight:800, fontSize:14, cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Đang lưu...' : isEdit ? '💾 Lưu' : '＋ Thêm chương'}
          </button>
          <button type="button" onClick={onClose}
            style={{ background:'none', color:'#6b7280', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'11px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            Huỷ
          </button>
        </div>
      </form>
    </div>
  )
}
