// src/components/affiliate/AffiliateWidget.jsx
// Smart product recommendations — shown in chapter reader & story page
import { useState } from 'react'
import { amazonLink, etsyLink, trackClick, getProductsForGenre } from '../../lib/affiliate'

const PLATFORM_STYLE = {
  amazon: { bg:'#fff8f0', border:'#ff9900', badge:'#ff9900', label:'Amazon', icon:'🛒' },
  etsy:   { bg:'#fff0f0', border:'#f45800', badge:'#f45800', label:'Etsy',   icon:'🎨' },
}

function ProductCard({ product, storyId, chapterId, userId, compact }) {
  const [clicked, setClicked] = useState(false)
  const ps = PLATFORM_STYLE[product.platform] || PLATFORM_STYLE.amazon

  const handleClick = async () => {
    setClicked(true)
    await trackClick({
      platform:    product.platform,
      productId:   product.id,
      productName: product.name,
      storyId, chapterId, userId,
    })

    const url = product.platform === 'amazon'
      ? amazonLink(product.id)
      : etsyLink(product.id, { clickref: storyId || 'readunlocked' })

    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => setClicked(false), 2000)
  }

  if (compact) return (
    <div onClick={handleClick}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', border:`1.5px solid ${clicked?ps.border:'#e8eaf0'}`, borderRadius:10, cursor:'pointer', transition:'all 0.2s' }}
      onMouseOver={e => e.currentTarget.style.borderColor=ps.border}
      onMouseOut={e => e.currentTarget.style.borderColor=clicked?ps.border:'#e8eaf0'}>
      <img src={product.img} alt={product.name}
        style={{ width:44, height:44, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:11, color:'#6b7280' }}>{product.price}</div>
      </div>
      <div style={{ flexShrink:0, textAlign:'right' }}>
        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:ps.badge, color:'#fff' }}>
          {ps.icon} {ps.label}
        </span>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#fff', border:`1.5px solid ${clicked?ps.border:'#e8eaf0'}`, borderRadius:12, overflow:'hidden', transition:'all 0.2s' }}
      onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
      onMouseOut={e => e.currentTarget.style.transform='none'}>
      <div style={{ position:'relative' }}>
        <img src={product.img} alt={product.name}
          style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
        <span style={{ position:'absolute', top:8, left:8, fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:20, background:ps.badge, color:'#fff' }}>
          {ps.icon} {ps.label}
        </span>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:4, lineHeight:1.3 }}>{product.name}</div>
        {product.tag && <div style={{ fontSize:11, color:'#6b7280', marginBottom:8, fontStyle:'italic' }}>"{product.tag}"</div>}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{product.price}</span>
          <button onClick={handleClick}
            style={{ padding:'7px 14px', background: clicked?'#16a34a':ps.badge, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background 0.2s' }}>
            {clicked ? '✓ Opening...' : 'Shop Now →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main widget ──────────────────────────────────────────────────
export default function AffiliateWidget({ genres = [], storyId, chapterId, userId, variant = 'strip' }) {
  const products = getProductsForGenre(genres)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Strip variant — shown between chapter pages (horizontal scroll)
  if (variant === 'strip') return (
    <div style={{ background:'linear-gradient(135deg,#fef9ec,#fff8f0)', border:'1px solid #fde68a', borderRadius:14, padding:'14px 16px', margin:'20px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <span style={{ fontSize:11, fontWeight:800, color:'#92400e', letterSpacing:1 }}>📦 READERS ALSO LOVE</span>
          <p style={{ margin:'2px 0 0', fontSize:11, color:'#a16207' }}>Handpicked for this story's fans · Affiliate links support Readunlocked</p>
        </div>
        <button onClick={() => setDismissed(true)}
          style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {products.slice(0,3).map((p,i) => (
          <ProductCard key={i} product={p} storyId={storyId} chapterId={chapterId} userId={userId} compact />
        ))}
      </div>
      <p style={{ margin:'10px 0 0', fontSize:10, color:'#d97706', textAlign:'center' }}>
        As an Amazon Associate and Etsy Affiliate, Readunlocked earns from qualifying purchases.
      </p>
    </div>
  )

  // Grid variant — shown on story page sidebar
  if (variant === 'grid') return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>🛍️ Fans Also Bought</h3>
          <p style={{ margin:'3px 0 0', fontSize:12, color:'#6b7280' }}>Curated picks for this genre</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"   alt="Amazon" style={{ height:16, opacity:0.6 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Etsy_logo.svg"    alt="Etsy"   style={{ height:16, opacity:0.6 }} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {products.slice(0,4).map((p,i) => (
          <ProductCard key={i} product={p} storyId={storyId} userId={userId} />
        ))}
      </div>
      <p style={{ margin:'10px 0 0', fontSize:10, color:'#9ca3af', textAlign:'center' }}>
        Affiliate links · Readunlocked earns a small commission at no extra cost to you
      </p>
    </div>
  )

  // Banner variant — shown at bottom of chapter
  if (variant === 'banner') return (
    <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius:14, padding:'20px', margin:'24px 0', overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
      <div style={{ fontSize:11, color:'#a5b4fc', fontWeight:700, letterSpacing:1, marginBottom:6 }}>ENJOY THE STORY? ✨</div>
      <h3 style={{ margin:'0 0 6px', fontSize:16, fontWeight:800, color:'#fff' }}>Shop the Vibe</h3>
      <p style={{ margin:'0 0 16px', fontSize:13, color:'#c7d2fe' }}>Products handpicked to match what you're reading</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {products.slice(0,2).map((p,i) => (
          <ProductCard key={i} product={p} storyId={storyId} chapterId={chapterId} userId={userId} compact />
        ))}
      </div>
      <p style={{ margin:'12px 0 0', fontSize:10, color:'#6366f1', textAlign:'center' }}>
        Amazon Associate & Etsy Affiliate — purchases support our translators
      </p>
    </div>
  )

  return null
}
