// src/pages/admin/BulkUpload.jsx
// Upload nhiều ảnh cùng lúc, drag & drop, tự động sắp xếp thứ tự
import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { uploadImage } from '../../lib/admin'
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

export default function BulkUpload() {
  const { storyId } = useParams()
  const navigate    = useNavigate()
  const fileRef     = useRef()
  const dropRef     = useRef()

  const [files, setFiles]       = useState([])   // {id, file, preview, name}
  const [form, setForm]         = useState({ title:'', order:1, locked:false, coinCost:5 })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})   // {fileId: 0-100}
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [dragging, setDragging] = useState(false)

  const addFiles = (newFiles) => {
    const items = Array.from(newFiles)
      .filter(f => f.type.startsWith('image/'))
      .map((f, i) => ({
        id: `${Date.now()}_${i}`,
        file: f,
        preview: URL.createObjectURL(f),
        name: f.name,
      }))
    setFiles(prev => [...prev, ...items])
  }

  // Drag & drop
  const onDragOver  = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop      = useCallback(e => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  // Reorder
  const moveUp   = (i) => { if (i===0) return; const a=[...files]; [a[i-1],a[i]]=[a[i],a[i-1]]; setFiles(a) }
  const moveDown = (i) => { if (i===files.length-1) return; const a=[...files]; [a[i],a[i+1]]=[a[i+1],a[i]]; setFiles(a) }
  const remove   = (id) => setFiles(f => f.filter(x => x.id !== id))

  const handleUpload = async () => {
    if (!form.title.trim()) { setError('Nhập tiêu đề chương.'); return }
    if (files.length === 0) { setError('Chọn ít nhất 1 ảnh.'); return }
    setError(''); setUploading(true)

    try {
      // Upload từng ảnh với progress
      const urls = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const url = await uploadImage(
          f.file,
          `stories/${storyId}/chapters/${Date.now()}_${i}_${f.name}`,
          (pct) => setProgress(p => ({...p, [f.id]: pct}))
        )
        urls.push(url)
      }

      // Upload thumbnail = ảnh đầu tiên
      const thumbnailUrl = urls[0] || ''

      // Lưu chapter vào Firestore
      await addDoc(collection(db, 'stories', storyId, 'chapters'), {
        title:        form.title,
        order:        form.order,
        locked:       form.locked,
        coinCost:     form.locked ? form.coinCost : 0,
        imageUrls:    urls,
        thumbnailUrl: thumbnailUrl,
        views:        0,
        readTime:     Math.ceil(files.length * 0.5),
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      })

      // Cập nhật updatedAt story
      await updateDoc(doc(db, 'stories', storyId), { updatedAt: serverTimestamp() })

      setDone(true)
    } catch(e) {
      setError('Lỗi upload: ' + e.message)
    } finally { setUploading(false) }
  }

  const totalProgress = files.length === 0 ? 0
    : Math.round(Object.values(progress).reduce((a,b)=>a+b,0) / files.length)

  if (done) return (
    <div style={{ textAlign:'center', padding:'50px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
      <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800 }}>Upload thành công!</h3>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>{files.length} ảnh đã được upload.</p>
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button onClick={() => { setFiles([]); setProgress({}); setDone(false); setForm(f=>({...f,order:f.order+1,title:''})) }}
          style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:800, cursor:'pointer', fontSize:14 }}>
          ＋ Upload chương tiếp theo
        </button>
        <Link to={`/admin/stories/${storyId}/chapters`}
          style={{ background:'#f1f5f9', color:'#374151', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:700, cursor:'pointer', fontSize:14, textDecoration:'none' }}>
          Xem danh sách chương
        </Link>
      </div>
    </div>
  )

  return (
    <AdminGuard require="ctv">
      <div style={{ maxWidth:720 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <Link to={`/admin/stories/${storyId}/chapters`} style={{ color:'#6b7280', textDecoration:'none', fontSize:18 }}>←</Link>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>📤 Bulk Upload Chương</h2>
        </div>

        {/* Chapter info */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:18, marginBottom:16 }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800 }}>Thông tin chương</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12, marginBottom:12 }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              placeholder="Tên chương (VD: Chương 1: Khởi đầu)"
              style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor='#6366f1'}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
            <input type="number" value={form.order} onChange={e=>setForm(f=>({...f,order:+e.target.value}))}
              placeholder="STT" min={1}
              style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', textAlign:'center', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              <input type="checkbox" checked={form.locked} onChange={e=>setForm(f=>({...f,locked:e.target.checked}))}
                style={{ width:16, height:16, cursor:'pointer' }} />
              🔒 Khoá chapter
            </label>
            {form.locked && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, color:'#374151' }}>Giá:</span>
                <input type="number" value={form.coinCost} onChange={e=>setForm(f=>({...f,coinCost:+e.target.value}))}
                  min={1} max={99} style={{ width:60, padding:'6px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, textAlign:'center', outline:'none' }} />
                <span style={{ fontSize:13, color:'#374151' }}>xu</span>
              </div>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !uploading && fileRef.current.click()}
          style={{ border:`2px dashed ${dragging?'#6366f1':'#d1d5db'}`, borderRadius:14, padding:'30px 20px', textAlign:'center', background: dragging?'#ede9fe':'#f8fafc', cursor:'pointer', marginBottom:16, transition:'all 0.2s' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📁</div>
          <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color: dragging?'#6366f1':'#374151' }}>
            {dragging ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh hoặc click để chọn'}
          </p>
          <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>Hỗ trợ JPG, PNG, WebP — chọn nhiều file cùng lúc</p>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files)} style={{ display:'none' }} />
        </div>

        {/* Preview grid */}
        {files.length > 0 && (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:800, fontSize:14 }}>{files.length} ảnh đã chọn</span>
              <button onClick={() => setFiles([])} style={{ fontSize:12, color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Xoá tất cả</button>
            </div>

            {/* Pages list */}
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              {files.map((f,i) => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:'1px solid #f8fafc' }}>
                  <span style={{ fontSize:12, color:'#9ca3af', width:20, textAlign:'right', flexShrink:0 }}>{i+1}</span>
                  <img src={f.preview} alt="" style={{ width:44, height:60, objectFit:'cover', borderRadius:6, flexShrink:0, border:'1px solid #e2e8f0' }} />
                  <span style={{ flex:1, fontSize:12, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>

                  {/* Progress bar nếu đang upload */}
                  {uploading && (
                    <div style={{ width:80, height:6, background:'#e2e8f0', borderRadius:99, flexShrink:0 }}>
                      <div style={{ height:'100%', background: progress[f.id]>=100?'#16a34a':'#6366f1', borderRadius:99, width:`${progress[f.id]||0}%`, transition:'width 0.3s' }} />
                    </div>
                  )}

                  {!uploading && (
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={()=>moveUp(i)} disabled={i===0}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:i===0?'default':'pointer', fontSize:11, opacity:i===0?0.3:1 }}>↑</button>
                      <button onClick={()=>moveDown(i)} disabled={i===files.length-1}
                        style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:i===files.length-1?'default':'pointer', fontSize:11, opacity:i===files.length-1?0.3:1 }}>↓</button>
                      <button onClick={()=>remove(f.id)}
                        style={{ width:24, height:24, borderRadius:6, border:'none', background:'#fef2f2', color:'#ef4444', cursor:'pointer', fontSize:12 }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={{ padding:'10px 14px', background:'#fef2f2', color:'#ef4444', borderRadius:10, marginBottom:12, fontSize:13 }}>{error}</div>}

        {/* Upload progress */}
        {uploading && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6b7280', marginBottom:6 }}>
              <span>Đang upload {files.length} ảnh...</span>
              <span>{totalProgress}%</span>
            </div>
            <div style={{ height:8, background:'#e2e8f0', borderRadius:99 }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:99, width:`${totalProgress}%`, transition:'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleUpload} disabled={uploading || files.length===0}
          style={{ width:'100%', padding:'14px', background: files.length===0||uploading?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor: files.length===0||uploading?'default':'pointer', opacity: files.length===0?0.5:1 }}>
          {uploading ? `Đang upload... ${totalProgress}%` : `⬆️ Upload ${files.length} ảnh`}
        </button>
      </div>
    </AdminGuard>
  )
}
