// src/lib/seo.js — Auto SEO: sitemap, OG tags, schema markup

// ── Dynamic OG tags per page ────────────────────────────────────
export function setPageMeta({ title, description, image, url, type = 'website' }) {
  const base = 'Mèo Kam Mập'
  const fullTitle = title ? `${title} — ${base}` : base

  document.title = fullTitle

  const setMeta = (property, content, attr = 'property') => {
    let el = document.querySelector(`meta[${attr}="${property}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, property); document.head.appendChild(el) }
    el.setAttribute('content', content)
  }

  setMeta('og:title',       fullTitle)
  setMeta('og:description', description || 'Đọc truyện tranh, manga, webtoon mới nhất tại Mèo Kam Mập.')
  setMeta('og:image',       image || '/og-cover.jpg')
  setMeta('og:url',         url || window.location.href)
  setMeta('og:type',        type)
  setMeta('description',    description || '', 'name')
  setMeta('twitter:card',   'summary_large_image', 'name')
  setMeta('twitter:title',  fullTitle, 'name')
  setMeta('twitter:image',  image || '/og-cover.jpg', 'name')
}

// ── JSON-LD Schema cho truyện ───────────────────────────────────
export function injectStorySchema(story) {
  const existing = document.getElementById('story-schema')
  if (existing) existing.remove()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name:        story.title,
    description: story.description,
    image:       story.coverUrl,
    author:      { '@type': 'Person', name: story.author || story.team },
    genre:       (story.genres || []).join(', '),
    url:         `${window.location.origin}/truyen/${story.id}`,
    publisher:   { '@type': 'Organization', name: 'Mèo Kam Mập' },
    inLanguage:  'vi',
    numberOfPages: story.chapterCount || 1,
  }

  const script = document.createElement('script')
  script.id = 'story-schema'
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  document.head.appendChild(script)
}

// ── Sitemap XML generator (gọi từ Cloud Function hoặc build script) ──
export function generateSitemapXml(stories, baseUrl = 'https://meokammap.com') {
  const now = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/the-loai`, priority: '0.8', changefreq: 'weekly' },
  ]

  const storyUrls = stories.map(s => ({
    loc:        `${baseUrl}/truyen/${s.id}`,
    priority:   '0.9',
    changefreq: 'daily',
    lastmod:    s.updatedAt || now,
  }))

  const allUrls = [...staticUrls, ...storyUrls]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`
}

// ── Hook: tự động set meta khi vào trang truyện ─────────────────
export function useStoryMeta(story) {
  if (!story || typeof window === 'undefined') return
  setPageMeta({
    title:       story.title,
    description: story.description?.slice(0, 160),
    image:       story.coverUrl,
    url:         `${window.location.origin}/truyen/${story.id}`,
    type:        'book',
  })
  injectStorySchema(story)
}
