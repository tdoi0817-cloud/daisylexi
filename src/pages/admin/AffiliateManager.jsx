// src/pages/admin/AffiliateManager.jsx
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { getAffiliateStats, amazonLink, etsyLink, AFFILIATE_CONFIG } from '../../lib/affiliate'
import AdminGuard from '../../components/admin/AdminGuard'

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000) return (n/1000).toFixed(1)+'K'
  return String(n)
}

const GENRES = ['Romance','Action','Mystery','Fantasy','Horror','Sci-Fi','Thriller','Slice of Life','Supernatural','Drama','default']

export default function AffiliateManager() {
  const [tab, setTab]         = useState('dashboard')
  const [stats, setStats]     = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Product form
  const [form, setForm] = useState({ platform:'amazon', id:'', name:'', price:'', img:'', tag:'', genre:'default' })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    Promise.all([
      getAffiliateStats(30).catch(() => null),
      getDocs(query(collection(db,'affiliateProducts'), orderBy('createdAt','desc'))).catch(()=>({docs:[]})),
    ]).then(([s, snap]) => {
      setStats(s)
      setProducts(snap.docs?.map(d=>({id:d.id,...d.data()})) || [])
    }).finally(() => setLoading(false))
  }, [])

  const saveProduct = async () => {
    if (!form.name || !form.id) return
    setSaving(true)
    try {
      const ref = await addDoc(collection(db,'affiliateProducts'), {
        ...form, active:true, clicks:0, createdAt:serverTimestamp()
      })
      setProducts(prev => [{id:ref.id,...form,active:true,clicks:0},...prev])
      setForm({ platform:'amazon', id:'', name:'', price:'', img:'', tag:'', genre:'default' })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch(e) { alert('Error: '+e.message) }
    finally { setSaving(false) }
  }

  const deleteProduct = async (pid) => {
    if (!confirm('Delete this product?')) return
    await deleteDoc(doc(db,'affiliateProducts',pid))
    setProducts(prev => prev.filter(p => p.id !== pid))
  }

  const iStyle = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>Loading...</div>

  return (
    <AdminGuard require="admin">
      <div style={{ maxWidth:800 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800 }}>🛍️ Affiliate Manager</h2>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>Amazon Associates + Etsy Affiliate integration</p>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:3, marginBottom:20 }}>
          {[['dashboard','📊 Dashboard'],['products','📦 Products'],['settings','⚙️ Settings']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)}
              style={{ flex:1, padding:'9px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:13, background:tab===k?'#fff':'transparent', color:tab===k?'#6366f1':'#6b7280', boxShadow:tab===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            {/* KPI cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Total Clicks',       value: fmt(stats?.total||0),                   icon:'👆', bg:'#ede9fe', color:'#6d28d9' },
                { label:'Amazon Clicks',      value: fmt(stats?.amazon?.count||0),            icon:'🛒', bg:'#fff8f0', color:'#c05621' },
                { label:'Etsy Clicks',        value: fmt(stats?.etsy?.count||0),              icon:'🎨', bg:'#fff0f0', color:'#c05621' },
                { label:'Est. Earnings',      value: `$${((stats?.amazon?.estimatedEarnings||0)+(stats?.etsy?.estimatedEarnings||0)).toFixed(2)}`, icon:'💰', bg:'#f0fdf4', color:'#166534' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:s.color, opacity:0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Platform breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              {[
                { name:'Amazon Associates', count:stats?.amazon?.count||0, earnings:stats?.amazon?.estimatedEarnings||0, rate:'4%', color:'#ff9900', bg:'#fff8f0', icon:'🛒' },
                { name:'Etsy Affiliate',    count:stats?.etsy?.count||0,   earnings:stats?.etsy?.estimatedEarnings||0,   rate:'6%', color:'#f45800', bg:'#fff0f0', icon:'🎨' },
              ].map(p => (
                <div key={p.name} style={{ background:p.bg, border:`1.5px solid ${p.color}30`, borderRadius:14, padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:24 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'#6b7280' }}>Commission rate: {p.rate}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:16, color:p.color }}>{fmt(p.count)}</div>
                      <div style={{ fontSize:10, color:'#6b7280' }}>Clicks</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:16, color:'#16a34a' }}>${p.earnings.toFixed(2)}</div>
                      <div style={{ fontSize:10, color:'#6b7280' }}>Est. Earned</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top products */}
            {stats?.topProducts?.length > 0 && (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', fontWeight:800, fontSize:15 }}>🏆 Top Clicked Products</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Product','Platform','Clicks','Action'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProducts.map((p,i) => (
                        <tr key={p.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'9px 14px', fontWeight:600 }}>{p.name || p.id}</td>
                          <td style={{ padding:'9px 14px' }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, background:p.platform==='amazon'?'#fff8f0':'#fff0f0', color:p.platform==='amazon'?'#c05621':'#c05621' }}>
                              {p.platform==='amazon'?'🛒 Amazon':'🎨 Etsy'}
                            </span>
                          </td>
                          <td style={{ padding:'9px 14px', fontWeight:700 }}>{p.clicks}</td>
                          <td style={{ padding:'9px 14px' }}>
                            <a href={p.platform==='amazon'?amazonLink(p.id):p.id} target="_blank" rel="noreferrer"
                              style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>View →</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!stats || stats.total === 0) && (
              <div style={{ textAlign:'center', padding:'40px 20px', background:'#f8fafc', borderRadius:14, border:'1px dashed #e2e8f0' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📊</div>
                <p style={{ color:'#6b7280', fontSize:14 }}>No clicks yet. Add products and they'll appear here when readers click.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div>
            {/* Add product form */}
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:20, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:800 }}>➕ Add Product</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Platform</label>
                  <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} style={iStyle}>
                    <option value="amazon">🛒 Amazon</option>
                    <option value="etsy">🎨 Etsy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Genre</label>
                  <select value={form.genre} onChange={e=>setForm(f=>({...f,genre:e.target.value}))} style={iStyle}>
                    {GENRES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>
                    {form.platform==='amazon' ? 'Amazon ASIN' : 'Etsy Listing URL'}
                  </label>
                  <input value={form.id} onChange={e=>setForm(f=>({...f,id:e.target.value}))}
                    placeholder={form.platform==='amazon'?'B07TGBGQWZ':'https://www.etsy.com/listing/...'}
                    style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Price</label>
                  <input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}
                    placeholder="$24.99" style={iStyle} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Product Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="Romance Novel Box Set" style={iStyle} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Image URL</label>
                  <input value={form.img} onChange={e=>setForm(f=>({...f,img:e.target.value}))}
                    placeholder="https://..." style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Tag line</label>
                  <input value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}
                    placeholder="Perfect for fans of this genre" style={iStyle} />
                </div>
              </div>

              {/* Preview link */}
              {form.id && (
                <div style={{ marginBottom:12, padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:11, color:'#6b7280' }}>
                  🔗 Affiliate link: <a href={form.platform==='amazon'?amazonLink(form.id):etsyLink(form.id)} target="_blank" rel="noreferrer" style={{ color:'#6366f1' }}>Preview →</a>
                </div>
              )}

              <button onClick={saveProduct} disabled={saving||!form.name||!form.id}
                style={{ width:'100%', padding:'11px', background:saved?'#16a34a':saving?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:saving||!form.name||!form.id?'default':'pointer' }}>
                {saved?'✓ Product Saved!':saving?'Saving...':'Add Product'}
              </button>
            </div>

            {/* Product list */}
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', fontWeight:800, fontSize:15 }}>
                📦 All Products ({products.length})
              </div>
              {products.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 20px', color:'#9ca3af', fontSize:14 }}>
                  No products yet. Add some above!
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Product','Platform','Genre','Price','Clicks','Action'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'9px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              {p.img && <img src={p.img} alt="" style={{ width:32, height:32, borderRadius:6, objectFit:'cover' }} />}
                              <span style={{ fontWeight:600 }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:'9px 14px' }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, background:p.platform==='amazon'?'#fff8f0':'#fff0f0', color:'#c05621' }}>
                              {p.platform==='amazon'?'🛒':'🎨'} {p.platform}
                            </span>
                          </td>
                          <td style={{ padding:'9px 14px', color:'#6b7280' }}>{p.genre}</td>
                          <td style={{ padding:'9px 14px', fontWeight:700 }}>{p.price}</td>
                          <td style={{ padding:'9px 14px' }}>{p.clicks||0}</td>
                          <td style={{ padding:'9px 14px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <a href={p.platform==='amazon'?amazonLink(p.id):etsyLink(p.id)} target="_blank" rel="noreferrer"
                                style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>View</a>
                              <button onClick={()=>deleteProduct(p.id)}
                                style={{ fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Amazon */}
            <div style={{ background:'#fff8f0', border:'1.5px solid #ff990030', borderRadius:14, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:28 }}>🛒</span>
                <div>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>Amazon Associates</h3>
                  <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>Earn 4% commission on qualifying purchases</p>
                </div>
              </div>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:4 }}>Current Associate Tag</div>
                <code style={{ fontSize:13, color:'#6366f1' }}>{AFFILIATE_CONFIG.amazon.tag}</code>
              </div>
              <div style={{ padding:'12px 14px', background:'#fff', borderRadius:10, border:'1px solid #e8eaf0' }}>
                <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#374151' }}>Setup Instructions:</p>
                <ol style={{ margin:0, paddingLeft:18, fontSize:13, color:'#6b7280', lineHeight:1.8 }}>
                  <li>Sign up at <a href="https://affiliate-program.amazon.com" target="_blank" rel="noreferrer" style={{ color:'#6366f1' }}>affiliate-program.amazon.com</a></li>
                  <li>Get your Associate Tag (e.g. <code>yoursite-20</code>)</li>
                  <li>Add to Netlify env vars: <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4 }}>VITE_AMAZON_ASSOCIATE_TAG</code></li>
                  <li>Redeploy the site</li>
                </ol>
              </div>
            </div>

            {/* Etsy */}
            <div style={{ background:'#fff0f0', border:'1.5px solid #f4580030', borderRadius:14, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:28 }}>🎨</span>
                <div>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>Etsy Affiliate (via Awin)</h3>
                  <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>Earn up to 6% commission on Etsy purchases</p>
                </div>
              </div>
              <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e8eaf0', padding:'12px 14px', marginBottom:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>Awin Publisher ID</div>
                    <code style={{ fontSize:12, color:'#6366f1' }}>{AFFILIATE_CONFIG.etsy.awinId || 'Not set'}</code>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>Etsy Merchant ID</div>
                    <code style={{ fontSize:12, color:'#6366f1' }}>6220 (fixed)</code>
                  </div>
                </div>
              </div>
              <div style={{ padding:'12px 14px', background:'#fff', borderRadius:10, border:'1px solid #e8eaf0' }}>
                <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#374151' }}>Setup Instructions:</p>
                <ol style={{ margin:0, paddingLeft:18, fontSize:13, color:'#6b7280', lineHeight:1.8 }}>
                  <li>Join <a href="https://www.awin.com" target="_blank" rel="noreferrer" style={{ color:'#6366f1' }}>Awin network</a> as a publisher</li>
                  <li>Apply to the <strong>Etsy</strong> program (Merchant ID: 6220)</li>
                  <li>Get your Awin Publisher ID</li>
                  <li>Add to Netlify: <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4 }}>VITE_AWIN_PUBLISHER_ID</code></li>
                  <li>Redeploy</li>
                </ol>
              </div>
            </div>

            {/* Disclosure */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 16px' }}>
              <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:800, color:'#374151' }}>📋 Required Affiliate Disclosure</p>
              <p style={{ margin:0, fontSize:12, color:'#6b7280', lineHeight:1.7 }}>
                Already included automatically on all product widgets. The disclosure reads:<br/>
                <em>"As an Amazon Associate and Etsy Affiliate, Readunlocked earns from qualifying purchases."</em><br/>
                This is required by FTC guidelines and Amazon/Etsy terms of service.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
