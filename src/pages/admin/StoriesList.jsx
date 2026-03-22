// src/pages/admin/StoriesList.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStories } from '../../lib/firestore'
import { deleteStory } from '../../lib/admin'
import { useAdmin } from '../../hooks/useAdmin'

export default function StoriesList() {
  const { isAdmin } = useAdmin()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    getStories({ limitN: 100 })
      .then(data => setStories(data))
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xoá truyện "${title}"? Hành động này không thể hoàn tác.`)) return
    setDeleting(id)
    await deleteStory(id).catch(console.error)
    setStories(s => s.filter(x => x.id !== id))
    setDeleting(null)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>📚 Quản lý truyện</h2>
        <Link to="/admin/stories/new"
          style={{ background:'#6366f1', color:'#fff', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, textDecoration:'none' }}>
          ＋ Thêm truyện
        </Link>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#9ca3af', padding:'40px 0' }}>Đang tải...</p>
      ) : stories.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 20px', background:'#fff', borderRadius:14, border:'1px solid #e8eaf0' }}>
          <div style={{ fontSize:48 }}>📚</div>
          <p style={{ color:'#6b7280', marginTop:8 }}>Chưa có truyện nào.</p>
          <Link to="/admin/stories/new" style={{ color:'#6366f1', fontWeight:700 }}>Thêm truyện đầu tiên →</Link>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
          {/* Table header */}
          <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 120px 100px 90px 120px', gap:0, padding:'10px 16px', background:'#f8fafc', borderBottom:'1px solid #e8eaf0', fontSize:12, fontWeight:700, color:'#6b7280' }}>
            <span>Ảnh</span><span>Tiêu đề</span><span>Team</span><span>Trạng thái</span><span>Views</span><span>Thao tác</span>
          </div>
          {stories.map((s, i) => (
            <div key={s.id} style={{ display:'grid', gridTemplateColumns:'60px 1fr 120px 100px 90px 120px', gap:0, padding:'10px 16px', alignItems:'center', borderBottom: i<stories.length-1?'1px solid #f1f5f9':'none', transition:'background 0.1s' }}
              onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e => e.currentTarget.style.background='transparent'}>
              <img src={s.coverUrl || `https://picsum.photos/seed/${s.id}/60/80`} alt="" style={{ width:42, height:58, borderRadius:6, objectFit:'cover' }} />
              <div style={{ minWidth:0, paddingRight:12 }}>
                <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{(s.genres||[]).join(', ')}</div>
              </div>
              <span style={{ fontSize:13, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.team}</span>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, textAlign:'center', display:'inline-block',
                background: s.status==='Hoàn thành'?'#dcfce7': s.status==='Tạm dừng'?'#fef3c7':'#ede9fe',
                color:      s.status==='Hoàn thành'?'#166534': s.status==='Tạm dừng'?'#92400e':'#6d28d9' }}>
                {s.status || 'Đang TH'}
              </span>
              <span style={{ fontSize:13, color:'#374151' }}>{(s.views||0).toLocaleString()}</span>
              <div style={{ display:'flex', gap:6 }}>
                <Link to={`/admin/stories/${s.id}/edit`}
                  style={{ fontSize:12, color:'#6366f1', fontWeight:700, textDecoration:'none', background:'#ede9fe', padding:'5px 10px', borderRadius:8 }}>
                  Sửa
                </Link>
                <Link to={`/admin/stories/${s.id}/chapters`}
                  style={{ fontSize:12, color:'#059669', fontWeight:700, textDecoration:'none', background:'#dcfce7', padding:'5px 10px', borderRadius:8 }}>
                  Chương
                </Link>
                {isAdmin && (
                  <button onClick={() => handleDelete(s.id, s.title)} disabled={deleting===s.id}
                    style={{ fontSize:12, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'5px 10px', borderRadius:8, border:'none', cursor:'pointer', opacity:deleting===s.id?0.5:1 }}>
                    Xoá
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
