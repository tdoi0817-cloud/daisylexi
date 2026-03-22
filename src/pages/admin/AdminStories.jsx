// src/pages/admin/AdminStories.jsx
// Quản lý truyện: thêm, sửa, xoá, upload thumbnail
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAllStories, createStory, updateStory, deleteStory, createChapter, getChaptersAdmin, updateChapter, deleteChapter } from '../../lib/adminFirestore'
import { uploadCover, uploadThumbnail, uploadChapterImages } from '../../lib/storage'

const GENRES_LIST = ['Tình cảm','Hành động','Tiên hiệp','Học đường','Trinh thám','Hài hước','Cổ đại','Drama','Bí ẩn','Kinh dị']
const STATUS_LIST = ['Đang tiến hành','Hoàn thành','Tạm dừng']

// ── Story Form Modal ─────────────────────────────────────────────
function StoryFormModal({ story, onClose, onSave }) {
  const [form, setForm]         = useState(story || { title:'', description:'', team:'', status:'Đang tiến hành', genres:[], coverUrl:'' })
  const [coverFile, setCover]   = useState(null)
  const [preview, setPreview]   = useState(story?.coverUrl || '')
  const [progress, setProgress] = useState(0)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const pickFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setCover(f)
    setPreview(URL.createObjectURL(f))
  }

  const toggleGenre = (g) => {
    setForm(prev => ({ ...prev, genres: prev.genres.includes(g) ? prev.genres.filter(x=>x!==g) : [...prev.genres,g] }))
  }

  const save = async () => {
    if (!form.title.trim()) { setError('Nhập tiêu đề truyện'); return }
    setSaving(true); setError('')
    try {
      let coverUrl = form.coverUrl
      if (coverFile) {
        const tempId = story?.id || `temp_${Date.now()}`
        coverUrl = await uploadCover(coverFile, tempId, setProgress)
      }
      await onSave({ ...form, coverUrl })
      onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:520, position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>✕</button>
        <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:800 }}>{story ? '✏️ Sửa truyện' : '➕ Thêm truyện mới'}</h3>

        <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
          {/* Cover upload */}
          <div>
            <div onClick={() => fileRef.current?.click()}
              style={{ width:100, height:140, borderRadius:10, border:'2px dashed #d1d5db', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', position:'relative', flexShrink:0 }}>
              {preview
                ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ textAlign:'center', color:'#9ca3af', fontSize:12 }}><div style={{ fontSize:28 }}>📷</div>Ảnh bìa</div>}
              {saving && progress > 0 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>{progress}%</div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display:'none' }} />
            <div style={{ fontSize:10, color:'#9ca3af', textAlign:'center', marginTop:4 }}>Click để đổi ảnh</div>
          </div>

          {/* Fields */}
          <div style={{ flex:1, minWidth:200, display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Tiêu đề *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Tên truyện"
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Team / Tác giả</label>
              <input value={form.team} onChange={e=>setForm(f=>({...f,team:e.target.value}))} placeholder="Tên team dịch"
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Trạng thái</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', background:'#fff' }}>
                {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Mô tả</label>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Tóm tắt nội dung truyện..."
            style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>

        {/* Genres */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Thể loại</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {GENRES_LIST.map(g => (
              <button key={g} onClick={() => toggleGenre(g)}
                style={{ padding:'4px 12px', borderRadius:16, border:'1.5px solid', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                  background: form.genres.includes(g)?'#6366f1':'#fff',
                  color:      form.genres.includes(g)?'#fff':'#6b7280',
                  borderColor:form.genres.includes(g)?'#6366f1':'#e2e8f0' }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color:'#ef4444', fontSize:13, background:'#fef2f2', padding:'8px 12px', borderRadius:8, marginBottom:12 }}>{error}</p>}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1.5px solid #e2e8f0', borderRadius:10, background:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', color:'#374151' }}>Huỷ</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'9px 24px', border:'none', borderRadius:10, background:'#6366f1', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Đang lưu...' : story ? 'Lưu thay đổi' : 'Thêm truyện'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chapter Form Modal ───────────────────────────────────────────
function ChapterFormModal({ storyId, chapter, nextOrder, onClose, onSave }) {
  const [form, setForm]           = useState(chapter || { title:'', order: nextOrder, locked:false, coinCost:5 })
  const [imgFiles, setImgFiles]   = useState([])
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumb]  = useState(chapter?.thumbnail || '')
  const [progress, setProgress]   = useState({ file:0, total:0, pct:0 })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const imgRef   = useRef()
  const thumbRef = useRef()

  const save = async () => {
    if (!form.title.trim()) { setError('Nhập tên chương'); return }
    setSaving(true); setError('')
    try {
      const chapterId = chapter?.id || `ch_${Date.now()}`
      let thumbnail = form.thumbnail || ''
      let imageUrls = form.imageUrls || []

      if (thumbFile) thumbnail = await uploadThumbnail(thumbFile, storyId, chapterId)

      if (imgFiles.length > 0) {
        imageUrls = await uploadChapterImages(imgFiles, storyId, chapterId, (i,t,p) =>
          setProgress({ file:i+1, total:t, pct:p })
        )
      }

      await onSave({ ...form, thumbnail, imageUrls })
      onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:500, position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>✕</button>
        <h3 style={{ margin:'0 0 18px', fontSize:16, fontWeight:800 }}>{chapter ? '✏️ Sửa chương' : '➕ Thêm chương mới'}</h3>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:2 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Tên chương *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Chương 1: Khởi đầu"
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Thứ tự</label>
              <input type="number" value={form.order} onChange={e=>setForm(f=>({...f,order:+e.target.value}))}
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>

          {/* Locked toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:'#f8fafc', borderRadius:10, border:'1.5px solid #e2e8f0' }}>
            <input type="checkbox" id="locked" checked={form.locked} onChange={e=>setForm(f=>({...f,locked:e.target.checked}))} style={{ width:16, height:16, cursor:'pointer' }} />
            <label htmlFor="locked" style={{ fontSize:13, fontWeight:600, cursor:'pointer', flex:1 }}>🔒 Khoá chapter (cần xu)</label>
            {form.locked && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>Giá:</span>
                <input type="number" value={form.coinCost} onChange={e=>setForm(f=>({...f,coinCost:+e.target.value}))} min={1}
                  style={{ width:60, padding:'5px 8px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', textAlign:'center' }} />
                <span style={{ fontSize:12, color:'#6b7280' }}>xu</span>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Thumbnail chương</label>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div onClick={() => thumbRef.current?.click()}
                style={{ width:60, height:60, borderRadius:8, border:'2px dashed #d1d5db', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', flexShrink:0 }}>
                {thumbPreview ? <img src={thumbPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:20 }}>📷</span>}
              </div>
              <input ref={thumbRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e=>{ const f=e.target.files[0]; if(f){ setThumbFile(f); setThumb(URL.createObjectURL(f)) } }} />
              <div style={{ fontSize:12, color:'#6b7280' }}>Click ảnh để chọn thumbnail (60×60px)</div>
            </div>
          </div>

          {/* Images upload */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>
              Ảnh nội dung chương ({imgFiles.length} file đã chọn)
            </label>
            <div onClick={() => imgRef.current?.click()}
              style={{ border:'2px dashed #d1d5db', borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer', background:'#f8fafc', transition:'border-color 0.15s' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='#6366f1'}
              onMouseOut={e=>e.currentTarget.style.borderColor='#d1d5db'}>
              <div style={{ fontSize:24, marginBottom:4 }}>🖼️</div>
              <div style={{ fontSize:13, color:'#6b7280', fontWeight:600 }}>Click để chọn ảnh chapter</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Chọn nhiều file cùng lúc, sắp xếp theo tên file</div>
            </div>
            <input ref={imgRef} type="file" accept="image/*" multiple style={{ display:'none' }}
              onChange={e => setImgFiles(Array.from(e.target.files).sort((a,b)=>a.name.localeCompare(b.name)))} />
            {imgFiles.length > 0 && (
              <div style={{ marginTop:8, display:'flex', gap:4, overflowX:'auto', paddingBottom:4 }}>
                {imgFiles.slice(0,8).map((f,i) => (
                  <img key={i} src={URL.createObjectURL(f)} alt="" style={{ width:48, height:64, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid #e2e8f0' }} />
                ))}
                {imgFiles.length > 8 && <div style={{ width:48, height:64, borderRadius:6, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#6b7280', fontWeight:700, flexShrink:0 }}>+{imgFiles.length-8}</div>}
              </div>
            )}
            {saving && progress.total > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>Upload ảnh {progress.file}/{progress.total} — {progress.pct}%</div>
                <div style={{ height:6, background:'#e2e8f0', borderRadius:99 }}>
                  <div style={{ height:'100%', background:'#6366f1', borderRadius:99, width:`${(progress.file-1)/progress.total*100+progress.pct/progress.total}%`, transition:'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p style={{ color:'#ef4444', fontSize:13, background:'#fef2f2', padding:'8px 12px', borderRadius:8, marginTop:12 }}>{error}</p>}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1.5px solid #e2e8f0', borderRadius:10, background:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Huỷ</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'9px 24px', border:'none', borderRadius:10, background:'#6366f1', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Đang upload...' : chapter ? 'Lưu' : 'Thêm chương'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminStories ────────────────────────────────────────────
export default function AdminStories({ user }) {
  const [stories, setStories]       = useState([])
  const [selected, setSelected]     = useState(null)   // story đang xem chapter
  const [chapters, setChapters]     = useState([])
  const [showStoryForm, setStoryForm] = useState(false)
  const [editStory, setEditStory]   = useState(null)
  const [showChForm, setChForm]     = useState(false)
  const [editCh, setEditCh]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')

  useEffect(() => {
    getAllStories().then(s => { setStories(s); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const loadChapters = async (story) => {
    setSelected(story)
    const cs = await getChaptersAdmin(story.id)
    setChapters(cs)
  }

  const handleSaveStory = async (data) => {
    if (editStory) {
      await updateStory(editStory.id, data)
      setStories(prev => prev.map(s => s.id===editStory.id ? {...s,...data} : s))
    } else {
      const id = await createStory(data)
      setStories(prev => [{ id, ...data }, ...prev])
    }
    setEditStory(null)
  }

  const handleDeleteStory = async (id) => {
    if (!confirm('Xoá truyện này? Hành động không thể hoàn tác.')) return
    await deleteStory(id)
    setStories(prev => prev.filter(s=>s.id!==id))
    if (selected?.id===id) setSelected(null)
  }

  const handleSaveChapter = async (data) => {
    if (editCh) {
      await updateChapter(selected.id, editCh.id, data)
      setChapters(prev => prev.map(c=>c.id===editCh.id?{...c,...data}:c))
    } else {
      const id = await createChapter(selected.id, data)
      setChapters(prev => [...prev, { id, ...data }].sort((a,b)=>a.order-b.order))
    }
    setEditCh(null)
  }

  const handleDeleteChapter = async (chId) => {
    if (!confirm('Xoá chương này?')) return
    await deleteChapter(selected.id, chId)
    setChapters(prev=>prev.filter(c=>c.id!==chId))
  }

  const filtered = stories.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Đang tải...</div>

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'#1e293b' }}>📚 Quản lý truyện</h2>
        <button onClick={() => { setEditStory(null); setStoryForm(true) }}
          style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          ➕ Thêm truyện
        </button>
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* Story list */}
        <div style={{ flex:1, minWidth:280 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm truyện..."
            style={{ width:'100%', padding:'8px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', marginBottom:12, boxSizing:'border-box', background:'#fff' }} />
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            {filtered.length === 0 && <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Chưa có truyện nào.</div>}
            {filtered.map((s,i) => (
              <div key={s.id}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderBottom:i<filtered.length-1?'1px solid #f1f5f9':'none', background:selected?.id===s.id?'#ede9fe':'transparent', transition:'background 0.1s' }}
                onClick={() => loadChapters(s)}>
                <img src={s.coverUrl||`https://picsum.photos/seed/${s.id}/60/80`} alt="" style={{ width:38, height:54, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid #e2e8f0' }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: selected?.id===s.id?'#6366f1':'#1e293b' }}>{s.title}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>👥 {s.team} · 👁 {(s.views||0).toLocaleString()}</div>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={e=>{ e.stopPropagation(); setEditStory(s); setStoryForm(true) }}
                    style={{ padding:'4px 8px', background:'#f1f5f9', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>✏️</button>
                  <button onClick={e=>{ e.stopPropagation(); handleDeleteStory(s.id) }}
                    style={{ padding:'4px 8px', background:'#fef2f2', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter list */}
        {selected && (
          <div style={{ flex:1.2, minWidth:280 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>📖 {selected.title}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{chapters.length} chương</div>
              </div>
              <button onClick={() => { setEditCh(null); setChForm(true) }}
                style={{ background:'#10b981', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                ➕ Thêm chương
              </button>
            </div>
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
              {chapters.length === 0 && <div style={{ padding:20, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Chưa có chương nào. Thêm chương đầu tiên!</div>}
              {chapters.map((ch, i) => (
                <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:i<chapters.length-1?'1px solid #f1f5f9':'none' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={ch.thumbnail||`https://picsum.photos/seed/${ch.id}/60/60`} alt="" style={{ width:44, height:44, borderRadius:7, objectFit:'cover', border:'1px solid #e2e8f0' }} />
                    {ch.locked && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🔒</div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.title}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:1, display:'flex', gap:8 }}>
                      <span>#{ch.order}</span>
                      {ch.locked && <span style={{ color:'#f59e0b' }}>🔒 {ch.coinCost}xu</span>}
                      {ch.imageUrls?.length > 0 && <span>🖼 {ch.imageUrls.length} ảnh</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={() => { setEditCh(ch); setChForm(true) }}
                      style={{ padding:'4px 8px', background:'#f1f5f9', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>✏️</button>
                    <button onClick={() => handleDeleteChapter(ch.id)}
                      style={{ padding:'4px 8px', background:'#fef2f2', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showStoryForm && (
        <StoryFormModal story={editStory} onClose={() => setStoryForm(false)} onSave={handleSaveStory} />
      )}
      {showChForm && selected && (
        <ChapterFormModal storyId={selected.id} chapter={editCh} nextOrder={chapters.length+1}
          onClose={() => setChForm(false)} onSave={handleSaveChapter} />
      )}
    </div>
  )
}
