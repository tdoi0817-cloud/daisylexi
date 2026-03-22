// src/pages/admin/AIGenerate.jsx
// Dùng Claude API để tự động generate title, mô tả, danh sách chương
import { useState } from 'react'
import { createStory, createChapter } from '../../lib/admin'
import { useNavigate } from 'react-router-dom'
import AdminGuard from '../../components/admin/AdminGuard'

const GENRES = ['Ngôn tình','Cổ đại','Tiên hiệp','Hành động','Học đường','Trinh thám','Hài hước','Kinh dị']
const TONES  = ['Ngọt sủng','Bi kịch','Hài hước','Nghiêm túc','Nhẹ nhàng','Hành động mạnh']

// ── Gọi Claude API ──────────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'Bạn là trợ lý viết truyện tranh ngôn tình Việt Nam. Luôn trả lời bằng JSON thuần túy, không có markdown hay backtick.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data.content?.find(b => b.type === 'text')?.text || ''
  try { return JSON.parse(text) }
  catch { return JSON.parse(text.replace(/```json|```/g,'').trim()) }
}

export default function AIGenerate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    genre: 'Ngôn tình', tone: 'Ngọt sủng',
    mainChar: '', setting: '', numChapters: 5, keywords: '',
  })
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState('') // loading message

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const generate = async () => {
    setError(''); setLoading(true); setResult(null)

    const prompt = `Tạo thông tin truyện tranh ngôn tình theo yêu cầu:
- Thể loại: ${form.genre}
- Tone: ${form.tone}
- Nhân vật chính: ${form.mainChar || 'tự chọn'}
- Bối cảnh: ${form.setting || 'tự chọn'}
- Từ khoá gợi ý: ${form.keywords || 'không có'}
- Số chương: ${form.numChapters}

Trả về JSON với cấu trúc:
{
  "title": "tiêu đề truyện hấp dẫn",
  "description": "mô tả 3-4 câu cuốn hút, có cliff-hanger",
  "author": "tên tác giả hư cấu",
  "genres": ["thể loại 1", "thể loại 2"],
  "chapters": [
    {"title": "Chương 1: tên chương", "summary": "tóm tắt ngắn 1 câu"},
    ...
  ],
  "coverPrompt": "mô tả ảnh bìa bằng tiếng Anh cho AI image generation"
}`

    try {
      setStep('🤖 AI đang sáng tác...')
      const data = await callClaude(prompt)
      setResult(data)
    } catch(e) {
      setError('Lỗi: ' + e.message + '. Kiểm tra lại API key trong Anthropic Console.')
    } finally { setLoading(false); setStep('') }
  }

  const saveToFirestore = async () => {
    if (!result) return
    setSaving(true)
    try {
      const storyId = await createStory({
        title:       result.title,
        description: result.description,
        author:      result.author,
        genres:      result.genres || [form.genre],
        team:        'AI Generated',
        status:      'Đang tiến hành',
        coverUrl:    '',
        coverPrompt: result.coverPrompt,
      }, null)

      // Tạo chapters
      for (let i = 0; i < result.chapters.length; i++) {
        await createChapter(storyId, {
          title:    result.chapters[i].title,
          summary:  result.chapters[i].summary,
          order:    i + 1,
          locked:   i >= 2,
          coinCost: 5,
          imageUrls: [],
        }, [], null)
      }

      navigate(`/admin/stories/${storyId}/edit`)
    } catch(e) {
      setError('Lỗi lưu: ' + e.message)
    } finally { setSaving(false) }
  }

  const iStyle = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <AdminGuard require="ctv">
      <div style={{ maxWidth:720 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800 }}>🤖 AI Generate Truyện</h2>
        <p style={{ margin:'0 0 22px', fontSize:13, color:'#6b7280' }}>Dùng Claude AI để tự động tạo title, mô tả, danh sách chương. Nội dung gốc 100% — không vi phạm bản quyền.</p>

        {/* Form */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:20, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:800 }}>⚙️ Cài đặt nội dung</h3>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Thể loại</label>
              <select value={form.genre} onChange={e=>set('genre',e.target.value)} style={iStyle}>
                {GENRES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Tone truyện</label>
              <select value={form.tone} onChange={e=>set('tone',e.target.value)} style={iStyle}>
                {TONES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Nhân vật chính (tùy chọn)</label>
              <input value={form.mainChar} onChange={e=>set('mainChar',e.target.value)}
                placeholder="VD: Nữ y sĩ nghèo, Nam hoàng tử..." style={iStyle} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Bối cảnh (tùy chọn)</label>
              <input value={form.setting} onChange={e=>set('setting',e.target.value)}
                placeholder="VD: Cổ đại Trung Hoa, Hiện đại Hà Nội..." style={iStyle} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:14, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Số chương generate</label>
              <input type="number" value={form.numChapters} onChange={e=>set('numChapters',+e.target.value)}
                min={3} max={20} style={iStyle} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Từ khoá gợi ý (tùy chọn)</label>
              <input value={form.keywords} onChange={e=>set('keywords',e.target.value)}
                placeholder="VD: xuyên không, báo thù, hôn ước..." style={iStyle} />
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            style={{ width:'100%', padding:'13px', background: loading?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:loading?'default':'pointer', opacity:loading?0.8:1 }}>
            {loading ? step || '🤖 Đang generate...' : '✨ Generate truyện bằng AI'}
          </button>
        </div>

        {error && <div style={{ padding:'12px 16px', background:'#fef2f2', color:'#ef4444', borderRadius:10, marginBottom:16, fontSize:13 }}>{error}</div>}

        {/* Result */}
        {result && (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#4c1d95' }}>✅ AI đã tạo xong!</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={generate}
                    style={{ padding:'7px 14px', background:'#fff', border:'1.5px solid #c4b5fd', borderRadius:8, fontSize:12, fontWeight:700, color:'#6d28d9', cursor:'pointer' }}>
                    🔄 Generate lại
                  </button>
                  <button onClick={saveToFirestore} disabled={saving}
                    style={{ padding:'7px 14px', background:'#6366f1', border:'none', borderRadius:8, fontSize:12, fontWeight:700, color:'#fff', cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}>
                    {saving?'Đang lưu...':'💾 Lưu vào Firestore'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding:20 }}>
              {/* Title */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1 }}>Tiêu đề</label>
                <div style={{ fontSize:20, fontWeight:800, color:'#1e293b', marginTop:4 }}>{result.title}</div>
              </div>

              {/* Genres */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1 }}>Thể loại</label>
                <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                  {(result.genres||[]).map(g=>(
                    <span key={g} style={{ background:'#ede9fe', color:'#6d28d9', fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:700 }}>{g}</span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:16, padding:'14px', background:'#f8fafc', borderRadius:10, border:'1px solid #f1f5f9' }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>Mô tả</label>
                <p style={{ margin:0, fontSize:14, color:'#374151', lineHeight:1.7 }}>{result.description}</p>
              </div>

              {/* Cover prompt */}
              {result.coverPrompt && (
                <div style={{ marginBottom:16, padding:'12px 14px', background:'#fef9ec', borderRadius:10, border:'1px solid #fde68a' }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#92400e', display:'block', marginBottom:6 }}>🎨 Prompt tạo ảnh bìa (dùng với Stable Diffusion / Midjourney)</label>
                  <code style={{ fontSize:12, color:'#78350f', lineHeight:1.6 }}>{result.coverPrompt}</code>
                </div>
              )}

              {/* Chapters */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:10 }}>Danh sách chương ({result.chapters?.length})</label>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {(result.chapters||[]).map((ch,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9' }}>
                      <span style={{ width:28, height:28, borderRadius:'50%', background: i<2?'#dcfce7':'#fef3c7', color: i<2?'#166534':'#92400e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
                        {i+1}
                      </span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:'#1e293b', marginBottom:2 }}>{ch.title}</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>{ch.summary}</div>
                      </div>
                      {i>=2 && <span style={{ marginLeft:'auto', fontSize:10, color:'#f59e0b', fontWeight:700, flexShrink:0 }}>🔒 Khoá</span>}
                      {i<2  && <span style={{ marginLeft:'auto', fontSize:10, color:'#16a34a', fontWeight:700, flexShrink:0 }}>✓ Free</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding:'14px 16px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12 }}>
          <p style={{ margin:0, fontSize:13, color:'#166534', fontWeight:600 }}>
            ✅ Nội dung AI generate là hoàn toàn gốc — không vi phạm bản quyền.<br/>
            <span style={{ fontWeight:400, opacity:0.8 }}>Sau khi lưu, vào trang Quản lý truyện để upload ảnh bìa và ảnh trang cho từng chương.</span>
          </p>
        </div>
      </div>
    </AdminGuard>
  )
}
