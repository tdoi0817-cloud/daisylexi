// src/lib/affiliate.js
// Amazon Associates + Etsy Affiliate link builder + click tracker

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

// ── Config (set your IDs in Netlify env vars) ────────────────────
export const AFFILIATE_CONFIG = {
  amazon: {
    tag:     import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'readunlocked-20',
    baseUrl: 'https://www.amazon.com/dp/',
    searchUrl: 'https://www.amazon.com/s',
  },
  etsy: {
    affiliateId: import.meta.env.VITE_ETSY_AFFILIATE_ID || '',
    network:     'awin', // Etsy uses Awin network
    awinId:      import.meta.env.VITE_AWIN_PUBLISHER_ID || '',
    baseUrl:     'https://www.etsy.com',
  },
}

// ── Build Amazon affiliate link ───────────────────────────────────
export function amazonLink(asin, opts = {}) {
  const tag = AFFILIATE_CONFIG.amazon.tag
  if (asin) {
    return `${AFFILIATE_CONFIG.amazon.baseUrl}${asin}?tag=${tag}&linkCode=ll1&language=en_US`
  }
  // Search link
  const params = new URLSearchParams({
    k: opts.keyword || '',
    tag,
    linkCode: 'll2',
  })
  return `${AFFILIATE_CONFIG.amazon.searchUrl}?${params}`
}

// ── Build Etsy affiliate link (via Awin) ─────────────────────────
export function etsyLink(etsyUrl, opts = {}) {
  const awinId = AFFILIATE_CONFIG.etsy.awinId
  if (!awinId) return etsyUrl // fallback to direct if not configured

  // Awin tracking URL format
  const params = new URLSearchParams({
    awinmid: '6220', // Etsy's Awin merchant ID
    awinaffid: awinId,
    clickref: opts.clickref || 'readunlocked',
    ued: encodeURIComponent(etsyUrl),
  })
  return `https://www.awin1.com/cread.php?${params}`
}

// ── Track affiliate click in Firestore ───────────────────────────
export async function trackClick({ platform, productId, productName, storyId, chapterId, userId }) {
  try {
    await addDoc(collection(db, 'affiliateClicks'), {
      platform,      // 'amazon' | 'etsy'
      productId,     // ASIN or Etsy listing ID
      productName,   // display name
      storyId:    storyId    || null,
      chapterId:  chapterId  || null,
      userId:     userId     || 'anonymous',
      clickedAt:  serverTimestamp(),
      // Estimated commission (tracked for reporting)
      estimatedCommission: platform === 'amazon' ? 0.04 : 0.06, // 4% Amazon, 6% Etsy
    })
  } catch(e) {
    // Non-blocking — never interrupt user experience
    console.warn('Affiliate track failed:', e.message)
  }
}

// ── Get affiliate stats (for admin dashboard) ─────────────────────
export async function getAffiliateStats(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const snap = await getDocs(
    query(collection(db, 'affiliateClicks'), orderBy('clickedAt','desc'), limit(500))
  )

  const clicks = snap.docs.map(d => ({ id:d.id, ...d.data() }))
  const amazon = clicks.filter(c => c.platform === 'amazon')
  const etsy   = clicks.filter(c => c.platform === 'etsy')

  return {
    total:    clicks.length,
    amazon:   { count: amazon.length, estimatedEarnings: amazon.reduce((a,c)=>a+(c.estimatedCommission||0)*100,0)/100 },
    etsy:     { count: etsy.length,   estimatedEarnings: etsy.reduce((a,c)=>a+(c.estimatedCommission||0)*100,0)/100 },
    recent:   clicks.slice(0, 20),
    topProducts: Object.entries(
      clicks.reduce((acc, c) => {
        const k = c.productId || 'unknown'
        acc[k] = acc[k] || { name:c.productName, platform:c.platform, clicks:0 }
        acc[k].clicks++
        return acc
      }, {})
    ).sort((a,b)=>b[1].clicks-a[1].clicks).slice(0,10).map(([id,v])=>({id,...v}))
  }
}

// ── Curated product lists per story genre ─────────────────────────
// Each product has: id (ASIN or Etsy URL), name, price, image, platform
export const GENRE_PRODUCTS = {
  Romance: [
    { platform:'amazon', id:'B07TGBGQWZ', name:'Romance Novel Box Set',       price:'$24.99', img:'https://picsum.photos/seed/romance1/200/200', tag:'Perfect for fans of forbidden love' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/romance-bookmark',   name:'Handmade Romance Bookmark', price:'$8.99',  img:'https://picsum.photos/seed/romance2/200/200', tag:'Custom couple illustration' },
    { platform:'amazon', id:'B09QKZP3YM', name:'Love Story Candle Set',        price:'$34.99', img:'https://picsum.photos/seed/romance3/200/200', tag:'Set the mood while reading' },
  ],
  Fantasy: [
    { platform:'amazon', id:'B07QPKDQPQ', name:'Fantasy Art Book',             price:'$39.99', img:'https://picsum.photos/seed/fantasy1/200/200', tag:'Inspiration for epic worlds' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/fantasy-map',        name:'Custom Fantasy Map Print',  price:'$19.99', img:'https://picsum.photos/seed/fantasy2/200/200', tag:'Hang your favorite world on your wall' },
    { platform:'amazon', id:'B08KQMN8LM', name:'Dragon Figurine Collection',   price:'$45.99', img:'https://picsum.photos/seed/fantasy3/200/200', tag:'For collectors' },
  ],
  Horror: [
    { platform:'amazon', id:'B07YTPN7JD', name:'Horror Anthology Collection',  price:'$19.99', img:'https://picsum.photos/seed/horror1/200/200', tag:'Classic horror tales' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/horror-poster',      name:'Gothic Art Print',          price:'$12.99', img:'https://picsum.photos/seed/horror2/200/200', tag:'Dark aesthetic wall art' },
    { platform:'amazon', id:'B09VXYZ123', name:'Blackout Curtains Set',        price:'$49.99', img:'https://picsum.photos/seed/horror3/200/200', tag:'Perfect reading atmosphere' },
  ],
  Action: [
    { platform:'amazon', id:'B07XVDKRZQ', name:'Manga Action Figure Set',     price:'$29.99', img:'https://picsum.photos/seed/action1/200/200', tag:'Collectible fighter series' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/samurai-print',      name:'Samurai Warrior Art Print', price:'$15.99', img:'https://picsum.photos/seed/action2/200/200', tag:'Hand-drawn original design' },
    { platform:'amazon', id:'B08N3QMXYZ', name:'LED Gaming Desk Lamp',        price:'$39.99', img:'https://picsum.photos/seed/action3/200/200', tag:'Read in style' },
  ],
  Mystery: [
    { platform:'amazon', id:'B07WQJKL89', name:'Mystery Novel Bundle',        price:'$22.99', img:'https://picsum.photos/seed/mystery1/200/200', tag:'Top-rated detective stories' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/detective-mug',      name:'Detective Quote Mug',       price:'$16.99', img:'https://picsum.photos/seed/mystery2/200/200', tag:'For late-night reading sessions' },
    { platform:'amazon', id:'B09ABCDE12', name:'Puzzle: Crime Scene 1000pc',  price:'$18.99', img:'https://picsum.photos/seed/mystery3/200/200', tag:'Solve it yourself' },
  ],
  default: [
    { platform:'amazon', id:'B07PQRS456', name:'Premium Reading Light',       price:'$22.99', img:'https://picsum.photos/seed/read1/200/200', tag:'Clip-on LED, perfect for night reading' },
    { platform:'etsy',   id:'https://www.etsy.com/listing/manga-bookmark',     name:'Manga Character Bookmark',  price:'$6.99',  img:'https://picsum.photos/seed/read2/200/200', tag:'Handmade, 50+ designs' },
    { platform:'amazon', id:'B08XYZMN90', name:'Cozy Reading Blanket',        price:'$34.99', img:'https://picsum.photos/seed/read3/200/200', tag:'Ultra-soft for long reading sessions' },
    { platform:'amazon', id:'B09QRSTUVW', name:'Manga Storage Box Set',       price:'$28.99', img:'https://picsum.photos/seed/read4/200/200', tag:'Organize your collection' },
  ],
}

export function getProductsForGenre(genres = []) {
  for (const g of genres) {
    if (GENRE_PRODUCTS[g]) return GENRE_PRODUCTS[g]
  }
  return GENRE_PRODUCTS.default
}
