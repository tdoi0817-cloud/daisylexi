// src/pages/admin/SEOManager.jsx
import { useState, useEffect } from 'react'
import { getStories } from '../../lib/firestore'
import { generateSitemapXml } from '../../lib/seo'
import AdminGuard from '../../components/admin/AdminGuard'

export default function SEOManager() {
  const [stories, setStories]   = useState([])
  const [sitemap, setSitemap]   = useState('')
  const [baseUrl, setBaseUrl]   = useState('https://meokammap.com')
  const [copied, setCopied]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [generating, setGen]    = useState(false)

  useEffect(() => {
    getStories({ limitN: 200 })
      .then(s => setStories(s))
      .finally(() => setLoading(false))
  }, [])

  const genSitemap = () => {
    setGen(true)
    const xml = generateSitemapXml(stories, baseUrl)
    setSitemap(xml)
    setTimeout(() => setGen(false), 300)
  }

  const copy = () => {
    navigator.clipboard.writeText(sitemap).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([sitemap], { type: 'text/xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'sitemap.xml'; a.click()
  }

  const SEO_TIPS = [
    { icon:'🏷', title:'OG Tags tự động',       desc:'Mỗi trang truyện tự động set og:title, og:image, og:description khi user share lên Facebook/TikTok.' },
    { icon:'📋', title:'JSON-LD Schema',         desc:'Schema Book được inject vào mỗi trang truyện — Google hiểu đây là sách/truyện, tăng rich snippet.' },
    { icon:'🗺', title:'Sitemap XML',            desc:'Generate sitemap.xml với tất cả truyện, upload lên server để Google index nhanh hơn.' },
    { icon:'⚡', title:'Canonical URL',          desc:'Mỗi trang có canonical URL để tránh duplicate content khi share qua nhiều nguồn.' },
    { icon:'🖼', title:'Image alt text',         desc:'Ảnh bìa truyện tự động có alt text = tên truyện — tốt cho Google Image Search.' },
    { icon:'📱', title:'Mobile-first',           desc:'Website responsive hoàn toàn — Google ưu tiên mobile-first indexing.' },
  ]

  return (
    <AdminGuard require="admin">
      <div style={{ maxWidth:720 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800 }}>🔍 SEO Manager</h2>
        <p style={{ margin:'0 0 22px', fontSize:13, color:'#6b7280' }}>Quản lý SEO tự động — sitemap, OG tags, schema markup.</p>

        {/* SEO checklist */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', overflow:'hidden', marginBottom:20 }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9' }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>✅ SEO đã được tích hợp sẵn</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {SEO_TIPS.map((tip, i) => (
              <div key={tip.title} style={{ padding:'14px 16px', borderBottom: i < SEO_TIPS.length-2 ? '1px solid #f1f5f9' : 'none', borderRight: i%2===0 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>{tip.icon}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{tip.title}</span>
                  <span style={{ marginLeft:'auto', background:'#dcfce7', color:'#166534', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:8 }}>Auto</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sitemap generator */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:20, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>🗺 Sitemap Generator</h3>

          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)}
              placeholder="https://meokammap.com"
              style={{ flex:1, padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', minWidth:200, fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor='#6366f1'}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
            <button onClick={genSitemap} disabled={loading||generating}
              style={{ padding:'9px 20px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {generating ? '...' : `Generate (${stories.length} URLs)`}
            </button>
          </div>

          {sitemap && (
            <>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <button onClick={copy}
                  style={{ padding:'7px 14px', background: copied?'#16a34a':'#f1f5f9', color: copied?'#fff':'#374151', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {copied ? '✓ Đã copy' : '📋 Copy XML'}
                </button>
                <button onClick={download}
                  style={{ padding:'7px 14px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  ⬇️ Download sitemap.xml
                </button>
              </div>
              <textarea readOnly value={sitemap} rows={8}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11, fontFamily:'monospace', background:'#f8fafc', resize:'vertical', boxSizing:'border-box' }} />
              <p style={{ fontSize:12, color:'#6b7280', marginTop:8, marginBottom:0 }}>
                📌 Upload file này lên <code>public/sitemap.xml</code> → submit lên <a href="https://search.google.com/search-console" target="_blank" style={{ color:'#6366f1' }}>Google Search Console</a>
              </p>
            </>
          )}
        </div>

        {/* Google Search Console guide */}
        <div style={{ background:'#fef9ec', border:'1px solid #fde68a', borderRadius:12, padding:18 }}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:800, color:'#92400e' }}>📌 Hướng dẫn submit Google Search Console</h4>
          {[
            '1. Vào search.google.com/search-console → Add property → URL prefix → nhập domain',
            '2. Verify quyền sở hữu bằng cách thêm meta tag vào index.html',
            '3. Sitemaps → Add sitemap → nhập: sitemap.xml → Submit',
            '4. Sau 1-3 ngày Google sẽ index tất cả trang truyện',
          ].map((step, i) => (
            <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'#78350f' }}>{step}</p>
          ))}
        </div>
      </div>
    </AdminGuard>
  )
}
