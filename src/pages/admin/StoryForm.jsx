// src/pages/admin/StoryForm.jsx — Thêm/Sửa truyện + upload thumbnail
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStory } from '../../lib/firestore'
import { createStory, updateStory, uploadImage } from '../../lib/admin'
import AdminGuard from '../../components/admin/AdminGuard'

const GENRES_LIST = ['Tình cảm','Drama','Hành động','Tiên hiệp','Học đường','Trinh thám','Hài hước','Cổ đại','Kinh dị','Phiêu lưu']
const STATUS_LIST = ['Đang tiến hành','Hoàn thành','Tạm dừng']

export default function StoryForm() {
  const { storyId } = useParams()
  const navigate    = useNavigate()
  const isEdit      = Boolean(storyId)
  const coverRef    = useRef()

  const [form, setForm] = useState({
    title:'', description:'', team:'', status:'Đang tiến hành',
    genres:[], coverUrl:'', rating:0,
  })
  const [coverFile, setCoverFile]   = useState(null)
  const [coverPreview, setCoverPrev]= useState('')
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  useEffect(() => {
    if (isEdit) {
      getStory(storyId).then(s => {
        if (s) { setForm(s); setCoverPrev(s.coverUrl) }
      })
    }
  }, [storyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleGenre = (g) => set('genres', form.genres.includes(g)
    ? form.genres.filter(x => x !== g)
    : [...form.genres, g])

  const onCoverChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPrev(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề.'); return }
    setError(''); setUploading(true); setProgress(0)
    try {
      if (isEdit) {
        await updateStory(storyId, form, coverFile)
        setSuccess('✅ Đã cập nhật truyện!')
      } else {
        const id = await createStory(form, coverFile)
        setSuccess('✅ Đã tạo truyện! Chuyển hướng...')
        setTimeout(() => navigate(`/admin/stories/${id}/chapters`), 1500)
      }
    } catch (err) {
      setError('Lỗi: ' + err.message)
    } finally { setUploading(false) }
  }

  const inputStyle = { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const labelStyle = { display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }

  return (
    <AdminGuard require="ctv">
      <div style={{ maxWidth:680 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
          <button onClick={() => navigate('/admin/stories')}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#6b7280' }}>←</button>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{isEdit ? '✏️ Chỉnh sửa truyện' : '＋ Thêm truyện mới'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>

            {/* Left: cover upload */}
            <div style={{ width:180, flexShrink:0 }}>
              <label style={labelStyle}>Ảnh bìa (thumbnail)</label>
              <div
                onClick={() => coverRef.current.click()}
                style={{ width:180, height:252, borderRadius:14, border:'2px dashed #d1d5db', background:'#f8fafc', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', transition:'border-color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.borderColor='#6366f1'}
                onMouseOut={e => e.currentTarget.style.borderColor='#d1d5db'}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, padding:'4px 0' }}>
                      Click để đổi ảnh
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:36, marginBottom:8 }}>🖼️</span>
                    <span style={{ fontSize:12, color:'#6b7280', textAlign:'center', lineHeight:1.4 }}>Click để upload<br/>ảnh bìa truyện</span>
                    <span style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>JPG, PNG, WebP</span>
                  </>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" onChange={onCoverChange} style={{ display:'none' }} />
              <p style={{ fontSize:11, color:'#9ca3af', marginTop:6, textAlign:'center' }}>Tỉ lệ 3:4 — tối đa 10MB</p>
            </div>

            {/* Right: form fields */}
            <div style={{ flex:1, minWidth:240, display:'flex', flexDirection:'column', gap:14 }}>

              <div>
                <label style={labelStyle}>Tiêu đề truyện *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="VD: Vùng Đất Hứa" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>

              <div>
                <label style={labelStyle}>Team / Tác giả *</label>
                <input value={form.team} onChange={e => set('team', e.target.value)}
                  placeholder="VD: Yên Khôi" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>

              <div>
                <label style={labelStyle}>Trạng thái</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Thể loại</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {GENRES_LIST.map(g => (
                    <button key={g} type="button" onClick={() => toggleGenre(g)}
                      style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                        background: form.genres.includes(g)?'#6366f1':'#fff',
                        color:      form.genres.includes(g)?'#fff':'#6b7280',
                        borderColor:form.genres.includes(g)?'#6366f1':'#e2e8f0' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mô tả / Tóm tắt</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tóm tắt nội dung truyện..." rows={4}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
            </div>
          </div>

          {/* Error / Success */}
          {error   && <div style={{ marginTop:14, padding:'10px 14px', background:'#fef2f2', color:'#ef4444', borderRadius:10, fontSize:13 }}>{error}</div>}
          {success && <div style={{ marginTop:14, padding:'10px 14px', background:'#f0fdf4', color:'#16a34a', borderRadius:10, fontSize:13 }}>{success}</div>}

          {/* Upload progress */}
          {uploading && (
            <div style={{ marginTop:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:4 }}>
                <span>Đang upload...</span><span>{progress}%</span>
              </div>
              <div style={{ height:6, background:'#e2e8f0', borderRadius:99 }}>
                <div style={{ height:'100%', background:'#6366f1', borderRadius:99, width:`${progress}%`, transition:'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button type="submit" disabled={uploading}
              style={{ background: uploading?'#a5b4fc':'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:uploading?'default':'pointer', opacity:uploading?0.7:1 }}>
              {uploading ? 'Đang lưu...' : isEdit ? '💾 Lưu thay đổi' : '＋ Tạo truyện'}
            </button>
            {isEdit && (
              <button type="button" onClick={() => navigate(`/admin/stories/${storyId}/chapters`)}
                style={{ background:'#f1f5f9', color:'#374151', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                📖 Quản lý chương →
              </button>
            )}
            <button type="button" onClick={() => navigate('/admin/stories')}
              style={{ background:'none', color:'#6b7280', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  )
}
