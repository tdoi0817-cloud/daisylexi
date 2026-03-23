// src/pages/admin/CMSManager.jsx
// Manage static pages (About, Terms...), blog posts, notifications
import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

const PAGE_SLUGS = ['about-us','terms-of-use','privacy-policy','contact','faq','dmca']

async function callClaude(prompt) {
  const res = await fetch('/.netlify/functions/claude-proxy', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:800,
      system:'You are a professional web content writer. Write clear, friendly, legally appropriate content.',
      messages:[{role:'user',content:prompt}] })
  })
  const d = await res.json()
  return d.content?.find(b=>b.type==='text')?.text?.trim() || ''
}

// ── Simple Rich Text (textarea with formatting toolbar) ──────────
function RichEditor({ value, onChange, rows = 12 }) {
  const ref = { current: null }
  const wrap = (before, after='') => {
    const ta = document.getElementById('cms-editor')
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const sel = value.slice(start, end) || 'text'
    const newVal = value.slice(0,start) + before + sel + after + value.slice(end)
    onChange(newVal)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start+before.length, start+before.length+sel.length) }, 0)
  }
  const tools = [
    { l:'B', fn:()=>wrap('**','**'), title:'Bold' },
    { l:'I', fn:()=>wrap('*','*'),   title:'Italic' },
    { l:'H2', fn:()=>wrap('\n## ',''), title:'Heading 2' },
    { l:'H3', fn:()=>wrap('\n### ',''), title:'Heading 3' },
    { l:'—', fn:()=>wrap('\n---\n',''), title:'Divider' },
    { l:'• List', fn:()=>wrap('\n- ',''), title:'Bullet list' },
    { l:'Link', fn:()=>wrap('[','](https://)'), title:'Link' },
  ]
  return (
    <div style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
      <div style={{ display:'flex', gap:4, padding:'6px 8px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', flexWrap:'wrap' }}>
        {tools.map(t=>(
          <button key={t.l} onClick={t.fn} title={t.title}
            style={{ padding:'4px 9px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', color:'#374151' }}>
            {t.l}
          </button>
        ))}
      </div>
      <textarea id="cms-editor" value={value} onChange={e=>onChange(e.target.value)}
        rows={rows} style={{ width:'100%', padding:'12px 14px', border:'none', outline:'none', fontSize:14, lineHeight:1.7, fontFamily:'Georgia, serif', resize:'vertical', boxSizing:'border-box' }} />
    </div>
  )
}

// ── Notification composer ────────────────────────────────────────
function NotifComposer({ onSend }) {
  const [form, setForm] = useState({ title:'', body:'', type:'info', link:'' })
  const [sending, setSending] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const IS = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const send = async () => {
    if (!form.title.trim()) return
    setSending(true)
    try {
      await addDoc(collection(db,'notifications'), { ...form, createdAt:serverTimestamp(), read:false, global:true })
      setForm({ title:'', body:'', type:'info', link:'' })
      onSend?.()
    } finally { setSending(false) }
  }
  const TYPES = { info:{bg:'#eff6ff',color:'#1d4ed8',icon:'ℹ️'}, success:{bg:'#f0fdf4',color:'#166534',icon:'✅'}, warning:{bg:'#fef9ec',color:'#92400e',icon:'⚠️'}, promo:{bg:'#faf5ff',color:'#6d28d9',icon:'🎉'} }
  const t = TYPES[form.type]||TYPES.info
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Type</label>
          <select value={form.type} onChange={e=>set('type',e.target.value)} style={IS}>
            {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Link (optional)</label>
          <input value={form.link} onChange={e=>set('link',e.target.value)} placeholder="/truyen/..." style={IS} />
        </div>
      </div>
      <div>
        <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Title *</label>
        <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Notification title..." style={IS} />
      </div>
      <div>
        <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Message</label>
        <textarea value={form.body} onChange={e=>set('body',e.target.value)} rows={3} placeholder="Notification body..." style={{ ...IS, resize:'vertical' }} />
      </div>
      {/* Preview */}
      {form.title && (
        <div style={{ padding:'12px 14px', background:t.bg, borderRadius:10, border:`1px solid ${t.color}20`, display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:t.color }}>{form.title}</div>
            {form.body && <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{form.body}</div>}
          </div>
        </div>
      )}
      <button onClick={send} disabled={sending||!form.title}
        style={{ padding:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer', opacity:sending||!form.title?0.6:1 }}>
        {sending ? 'Sending...' : '📢 Send to All Users'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function CMSManager() {
  const [tab, setTab]       = useState('pages')
  const [pages, setPages]   = useState([])
  const [posts, setPosts]   = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)  // {type, doc}
  const [saving, setSaving]   = useState(false)
  const [aiLoading, setAiLoad]= useState(false)
  const [toast, setToast]     = useState('')

  const showToast = (m,ms=3000) => { setToast(m); setTimeout(()=>setToast(''),ms) }

  const load = async () => {
    setLoading(true)
    const [ps, po, no] = await Promise.all([
      getDocs(query(collection(db,'pages'), orderBy('updatedAt','desc'))).catch(()=>({docs:[]})),
      getDocs(query(collection(db,'posts'), orderBy('createdAt','desc'))).catch(()=>({docs:[]})),
      getDocs(query(collection(db,'notifications'), orderBy('createdAt','desc'))).catch(()=>({docs:[]})),
    ])
    setPages(ps.docs.map(d=>({id:d.id,...d.data()})))
    setPosts(po.docs.map(d=>({id:d.id,...d.data()})))
    setNotifs(no.docs.map(d=>({id:d.id,...d.data()})))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveDoc = async () => {
    if (!editing) return
    setSaving(true)
    const colName = editing.type === 'page' ? 'pages' : 'posts'
    try {
      const data = { ...editing.doc, updatedAt:serverTimestamp() }
      if (editing.doc.id) {
        await updateDoc(doc(db,colName,editing.doc.id), data)
      } else {
        const ref = await addDoc(collection(db,colName), { ...data, createdAt:serverTimestamp() })
        editing.doc.id = ref.id
      }
      await load(); setEditing(null); showToast('✅ Saved!')
    } catch(e) { showToast('❌ '+e.message) }
    finally { setSaving(false) }
  }

  const deleteDoc2 = async (colName, id) => {
    if (!confirm('Delete this?')) return
    await deleteDoc(doc(db,colName,id))
    await load(); showToast('🗑 Deleted.')
  }

  const aiWrite = async () => {
    if (!editing) return
    setAiLoad(true)
    try {
      const isPage = editing.type==='page'
      const raw = await callClaude(`Write ${isPage?'a professional web page':'a blog post'} for a manga/webcomic reading platform called Readunlocked.
Page: "${editing.doc.title||editing.doc.slug}"
${editing.doc.content ? 'Current content to improve: '+editing.doc.content.slice(0,200) : 'Write from scratch.'}
Use markdown formatting. Be friendly, clear, professional. ${isPage?'Legal pages should be readable, not intimidating.':'Blog posts should be engaging and useful for manga readers.'} 300-500 words.`)
      setEditing(e => ({...e, doc:{...e.doc, content:raw}}))
      showToast('✨ AI wrote the content!')
    } catch(e) { showToast('❌ AI error: '+e.message) }
    finally { setAiLoad(false) }
  }

  const timeAgo = (ts) => {
    if (!ts) return '—'
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    const s = Math.floor((Date.now()-d)/1000)
    if (s<3600) return Math.floor(s/60)+'m ago'
    if (s<86400) return Math.floor(s/3600)+'h ago'
    return Math.floor(s/86400)+'d ago'
  }

  const IS = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <AdminGuard require="admin">
      <div style={{ maxWidth:860 }}>
        {toast && (
          <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#1e293b',color:'#fff',padding:'10px 22px',borderRadius:30,fontSize:13,fontWeight:700,zIndex:9999 }}>
            {toast}
          </div>
        )}

        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800 }}>🗂 Content Manager</h2>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280' }}>Manage pages, blog posts, and notifications</p>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:3, marginBottom:20 }}>
          {[['pages',`📄 Pages (${pages.length})`],['posts',`📝 Posts (${posts.length})`],['notifs',`🔔 Notifications (${notifs.length})`]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ flex:1, padding:'9px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:13, background:tab===k?'#fff':'transparent', color:tab===k?'#6366f1':'#6b7280', boxShadow:tab===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── EDITOR MODAL ── */}
        {editing && (
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
            <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:760,maxHeight:'92vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
              {/* Modal header */}
              <div style={{ padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:15 }}>{editing.doc.id?'Edit':'New'} {editing.type==='page'?'Page':'Post'}</div>
                  <div style={{ fontSize:12,color:'#9ca3af' }}>URL: /{editing.type==='page'?'page':'blog'}/{editing.doc.slug||'...'}</div>
                </div>
                <button onClick={aiWrite} disabled={aiLoading}
                  style={{ padding:'7px 14px',background:'#ede9fe',color:'#6d28d9',border:'none',borderRadius:9,fontWeight:700,fontSize:12,cursor:'pointer' }}>
                  {aiLoading?'⏳ Writing...':'✨ AI Write'}
                </button>
                <button onClick={saveDoc} disabled={saving}
                  style={{ padding:'7px 16px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:9,fontWeight:800,fontSize:12,cursor:'pointer',opacity:saving?0.7:1 }}>
                  {saving?'Saving...':'💾 Save'}
                </button>
                <button onClick={()=>setEditing(null)} style={{ background:'none',border:'none',fontSize:22,color:'#9ca3af',cursor:'pointer' }}>×</button>
              </div>

              {/* Modal body */}
              <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12 }}>
                <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:12 }}>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Title *</label>
                    <input value={editing.doc.title||''} onChange={e=>setEditing(ed=>({...ed,doc:{...ed.doc,title:e.target.value}}))} style={IS} placeholder="Page title..." />
                  </div>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Slug (URL)</label>
                    <input value={editing.doc.slug||''} onChange={e=>setEditing(ed=>({...ed,doc:{...ed.doc,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')}}))} style={IS} placeholder="about-us" />
                  </div>
                </div>

                {editing.type==='post' && (
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Excerpt / Summary</label>
                    <textarea value={editing.doc.excerpt||''} onChange={e=>setEditing(ed=>({...ed,doc:{...ed.doc,excerpt:e.target.value}}))}
                      rows={2} style={{ ...IS,resize:'vertical' }} placeholder="Short description for previews..." />
                  </div>
                )}

                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:6 }}>Content (Markdown)</label>
                  <RichEditor value={editing.doc.content||''} onChange={v=>setEditing(ed=>({...ed,doc:{...ed.doc,content:v}}))} />
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Status</label>
                    <select value={editing.doc.status||'draft'} onChange={e=>setEditing(ed=>({...ed,doc:{...ed.doc,status:e.target.value}}))} style={IS}>
                      <option value="draft">📝 Draft</option>
                      <option value="published">✅ Published</option>
                    </select>
                  </div>
                  {editing.type==='post' && (
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Category</label>
                      <select value={editing.doc.category||'news'} onChange={e=>setEditing(ed=>({...ed,doc:{...ed.doc,category:e.target.value}}))} style={IS}>
                        {['news','announcement','tutorial','feature','community'].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGES TAB ── */}
        {tab==='pages' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <p style={{ margin:0, fontSize:13, color:'#6b7280' }}>Manage About Us, Terms, Privacy and other static pages</p>
              <button onClick={()=>setEditing({type:'page',doc:{title:'',slug:'',content:'',status:'draft'}})}
                style={{ padding:'9px 18px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:10,fontWeight:800,fontSize:13,cursor:'pointer' }}>
                + New Page
              </button>
            </div>

            {/* Quick create from template */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>Quick Create:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {PAGE_SLUGS.filter(slug => !pages.find(p=>p.slug===slug)).map(slug => (
                  <button key={slug} onClick={()=>setEditing({type:'page',doc:{title:slug.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),slug,content:'',status:'draft'}})}
                    style={{ padding:'5px 12px',background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',color:'#374151' }}>
                    + {slug}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <div style={{ textAlign:'center',padding:40,color:'#9ca3af' }}>Loading...</div> : (
              <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
                {pages.length===0 ? (
                  <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:13 }}>No pages yet. Create your first page above.</div>
                ) : pages.map(p=>(
                  <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:14 }}>{p.title}</div>
                      <div style={{ fontSize:11,color:'#9ca3af' }}>/page/{p.slug} · {timeAgo(p.updatedAt)}</div>
                    </div>
                    <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:p.status==='published'?'#dcfce7':'#f1f5f9',color:p.status==='published'?'#166534':'#6b7280' }}>
                      {p.status==='published'?'✅ Live':'📝 Draft'}
                    </span>
                    <a href={`/page/${p.slug}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:11,color:'#6b7280',textDecoration:'none' }}>👁 View</a>
                    <button onClick={()=>setEditing({type:'page',doc:{...p}})}
                      style={{ fontSize:11,color:'#6366f1',background:'#ede9fe',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontWeight:700 }}>Edit</button>
                    <button onClick={()=>deleteDoc2('pages',p.id)}
                      style={{ fontSize:11,color:'#ef4444',background:'#fef2f2',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontWeight:700 }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB ── */}
        {tab==='posts' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <p style={{ margin:0,fontSize:13,color:'#6b7280' }}>Blog posts, announcements, news</p>
              <button onClick={()=>setEditing({type:'post',doc:{title:'',slug:'',content:'',excerpt:'',status:'draft',category:'news'}})}
                style={{ padding:'9px 18px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:10,fontWeight:800,fontSize:13,cursor:'pointer' }}>
                + New Post
              </button>
            </div>
            <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
              {posts.length===0 ? (
                <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:13 }}>No posts yet.</div>
              ) : posts.map(p=>(
                <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{p.title}</div>
                    <div style={{ fontSize:11,color:'#9ca3af' }}>{p.category} · {timeAgo(p.createdAt)}</div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:p.status==='published'?'#dcfce7':'#f1f5f9',color:p.status==='published'?'#166534':'#6b7280' }}>
                    {p.status==='published'?'✅ Live':'📝 Draft'}
                  </span>
                  <button onClick={()=>setEditing({type:'post',doc:{...p}})}
                    style={{ fontSize:11,color:'#6366f1',background:'#ede9fe',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontWeight:700 }}>Edit</button>
                  <button onClick={()=>deleteDoc2('posts',p.id)}
                    style={{ fontSize:11,color:'#ef4444',background:'#fef2f2',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontWeight:700 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab==='notifs' && (
          <div>
            <div style={{ background:'#fff',border:'1px solid #e8eaf0',borderRadius:14,padding:18,marginBottom:16 }}>
              <h3 style={{ margin:'0 0 14px',fontSize:15,fontWeight:800 }}>📢 Send New Notification</h3>
              <NotifComposer onSend={()=>{load();showToast('✅ Notification sent!')}} />
            </div>

            {/* Sent notifications */}
            <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
              <div style={{ padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontWeight:800,fontSize:14 }}>
                Sent Notifications ({notifs.length})
              </div>
              {notifs.length===0 ? (
                <div style={{ textAlign:'center',padding:'24px',color:'#9ca3af',fontSize:13 }}>No notifications sent yet.</div>
              ) : notifs.map(n=>{
                const ICONS = {info:'ℹ️',success:'✅',warning:'⚠️',promo:'🎉'}
                return (
                  <div key={n.id} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',borderBottom:'1px solid #f1f5f9' }}>
                    <span style={{ fontSize:18,flexShrink:0 }}>{ICONS[n.type]||'ℹ️'}</span>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:13 }}>{n.title}</div>
                      {n.body&&<div style={{ fontSize:11,color:'#6b7280',marginTop:2 }}>{n.body}</div>}
                      <div style={{ fontSize:10,color:'#9ca3af',marginTop:3 }}>{timeAgo(n.createdAt)}{n.link&&` · → ${n.link}`}</div>
                    </div>
                    <button onClick={()=>deleteDoc2('notifications',n.id)}
                      style={{ fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer' }}>🗑</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
