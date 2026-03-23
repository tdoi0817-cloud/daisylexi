// src/pages/PageView.jsx — Render CMS pages (About Us, Terms, etc)
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Simple markdown renderer (no library needed)
function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:800;margin:20px 0 8px;color:#1e293b">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:20px;font-weight:800;margin:24px 0 10px;color:#1e293b">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:900;margin:0 0 16px;color:#1e293b">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/^- (.+)$/gm,    '<li style="margin:4px 0;color:#374151">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:10px 0">$&</ul>')
    .replace(/^---$/gm,       '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6366f1;text-decoration:underline">$1</a>')
    .replace(/^> (.+)$/gm,    '<blockquote style="border-left:3px solid #6366f1;padding:8px 16px;margin:12px 0;color:#6b7280;font-style:italic">$1</blockquote>')
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.startsWith('<') ? p : `<p style="margin:0 0 16px;line-height:1.8;color:#374151">${p}</p>`)
    .join('\n')
}

// Static fallback content for common pages
const STATIC_PAGES = {
  'about-us': {
    title: 'About Us',
    content: `# About Readunlocked

## Your Gateway to Unlimited Manga & Webcomics

Welcome to Readunlocked — where great stories come to life. We're a community-powered platform dedicated to making manga and webcomics accessible to readers everywhere.

### Our Mission

We believe great stories shouldn't be locked behind high paywalls. Our mission is simple: **connect passionate readers with incredible artists and creators.**

### What We Offer

- A curated library of manga, manhwa, and webcomics
- Free chapters to get you hooked
- Affordable coin system to unlock more
- Multi-language support with built-in translation
- A thriving community of readers and translators

### Our Team

Readunlocked is built by a small, passionate team of manga lovers. We work with talented translators (CTVs) from around the world to bring you quality translations fast.

---

Questions? Reach us at **hello@readunlocked.com**`
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `# Privacy Policy

*Last updated: March 2026*

## Information We Collect

We collect information you provide directly — such as your name, email address, and payment information when you create an account or make a purchase.

We also collect usage data automatically, including pages visited, chapters read, and interaction data to improve our service.

## How We Use Your Information

- To provide and improve our services
- To process transactions and send related information
- To send promotional communications (you can opt out anytime)
- To comply with legal obligations

## Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or disclosure.

## Your Rights

You have the right to access, correct, or delete your personal data at any time. Contact us at **privacy@readunlocked.com**

## Cookies

We use cookies to improve your experience. You can disable cookies in your browser settings, though some features may not work properly.

---

If you have questions about this policy, contact us at **legal@readunlocked.com**`
  },
  'terms-of-use': {
    title: 'Terms of Use',
    content: `# Terms of Use

*Last updated: March 2026*

## Acceptance of Terms

By accessing or using Readunlocked, you agree to be bound by these Terms of Use. If you do not agree, please do not use our service.

## User Accounts

You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.

## Content Policy

Users may not upload, post, or transmit content that:

- Infringes on intellectual property rights
- Contains hate speech or harassment
- Is sexually explicit involving minors
- Violates any applicable laws

## Coins & Payments

Coins purchased on Readunlocked are non-refundable except where required by law. Coins have no cash value and cannot be transferred between accounts.

## Disclaimer

Readunlocked is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.

---

Contact us at **legal@readunlocked.com** with any questions.`
  },
  'contact': {
    title: 'Contact Us',
    content: `# Contact Us

We'd love to hear from you! Reach out through any of the channels below.

## General Inquiries

**Email:** hello@readunlocked.com

## Business & Partnerships

**Email:** business@readunlocked.com

## Technical Support

**Email:** support@readunlocked.com

## For Translators & Contributors

Interested in joining our team? Visit our [Contributors page](/contributors) to learn more and apply.

---

We typically respond within 1-3 business days.`
  },
}

export default function PageView() {
  const { slug } = useParams()
  const [page, setPage]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [notFound, setNF]   = useState(false)

  useEffect(() => {
    setLoad(true); setNF(false); setPage(null)
    // Try Firestore first
    getDocs(query(collection(db,'pages'), where('slug','==',slug), where('status','==','published')))
      .then(snap => {
        if (!snap.empty) {
          setPage({ id:snap.docs[0].id, ...snap.docs[0].data() })
        } else if (STATIC_PAGES[slug]) {
          // Fall back to static content
          setPage({ slug, ...STATIC_PAGES[slug], isStatic:true })
        } else {
          setNF(true)
        }
      })
      .catch(() => {
        // If Firestore fails, use static
        if (STATIC_PAGES[slug]) setPage({ slug, ...STATIC_PAGES[slug], isStatic:true })
        else setNF(true)
      })
      .finally(() => setLoad(false))
  }, [slug])

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      Loading...
    </div>
  )

  if (notFound) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
      <h2 style={{ margin:'0 0 8px', fontWeight:800 }}>Page not found</h2>
      <p style={{ color:'#6b7280', marginBottom:20 }}>This page hasn't been created yet.</p>
      <Link to="/" style={{ color:'#6366f1', textDecoration:'none', fontWeight:700 }}>← Back to Home</Link>
    </div>
  )

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'32px 16px 60px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:13, color:'#9ca3af', marginBottom:24 }}>
        <Link to="/" style={{ color:'#6366f1', textDecoration:'none' }}>Home</Link>
        <span style={{ margin:'0 8px' }}>›</span>
        <span>{page?.title}</span>
        {page?.isStatic && (
          <span style={{ marginLeft:10, fontSize:10, background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>
            Default — edit in Admin CMS
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eaf0', padding:'32px 36px' }}>
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page?.content || '') }}
          style={{ fontSize:15, lineHeight:1.8 }}
        />
      </div>

      {/* Footer nav */}
      <div style={{ marginTop:24, display:'flex', gap:16, flexWrap:'wrap' }}>
        {Object.entries(STATIC_PAGES).filter(([s]) => s !== slug).map(([s, p]) => (
          <Link key={s} to={`/page/${s}`}
            style={{ fontSize:13, color:'#6366f1', textDecoration:'none', fontWeight:600 }}>
            {p.title} →
          </Link>
        ))}
      </div>
    </div>
  )
}
