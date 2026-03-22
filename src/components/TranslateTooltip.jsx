// src/components/TranslateTooltip.jsx
// Select any text → popup appears with translation
import { useState, useEffect, useRef, useCallback } from 'react'
import { translateText, openGoogleTranslate, LANGUAGES } from '../lib/translate'

export default function TranslateTooltip({ enabled = true }) {
  const [tooltip, setTooltip]     = useState(null)  // {x, y, text, result, loading}
  const [targetLang, setTargetLang] = useState('vi')
  const [showLangPicker, setLangPicker] = useState(false)
  const tooltipRef = useRef()

  const handleSelection = useCallback(async () => {
    if (!enabled) return
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (!text || text.length < 2 || text.length > 500) {
      setTooltip(null)
      return
    }

    const range  = sel.getRangeAt(0)
    const rect   = range.getBoundingClientRect()
    const x      = rect.left + rect.width / 2 + window.scrollX
    const y      = rect.top + window.scrollY - 12

    setTooltip({ x, y, text, result: null, loading: true })

    const result = await translateText(text, targetLang)
    setTooltip(prev => prev && prev.text === text
      ? { ...prev, result: result || '⚠️ Translation failed', loading: false }
      : prev
    )
  }, [enabled, targetLang])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [handleSelection])

  // Click outside to close
  useEffect(() => {
    const close = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltip(null)
        setLangPicker(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (!tooltip) return null

  const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang

  // Keep tooltip in viewport
  const vw      = window.innerWidth
  const left    = Math.max(16, Math.min(tooltip.x - 160, vw - 336))
  const top     = Math.max(8, tooltip.y - 160)

  return (
    <div
      ref={tooltipRef}
      style={{
        position:     'fixed',
        left,
        top,
        width:        320,
        background:   '#1e293b',
        borderRadius: 14,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.35)',
        zIndex:       9999,
        overflow:     'hidden',
        fontFamily:   "'Nunito', 'Segoe UI', sans-serif",
        animation:    'fadeUp 0.15s ease',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .tl-btn:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:1 }}>TRANSLATE</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {/* Language picker */}
          <div style={{ position:'relative' }}>
            <button className="tl-btn" onClick={() => setLangPicker(s=>!s)}
              style={{ fontSize:11, color:'#e2e8f0', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontWeight:600 }}>
              {langLabel} ▾
            </button>
            {showLangPicker && (
              <div style={{ position:'absolute', top:'100%', right:0, background:'#0f172a', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', minWidth:160, zIndex:10, marginTop:4, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                {LANGUAGES.map(lang => (
                  <button key={lang.code}
                    onClick={() => { setTargetLang(lang.code); setLangPicker(false); setTooltip(t => t ? {...t,result:null,loading:true} : t) }}
                    style={{ display:'block', width:'100%', padding:'8px 14px', background: lang.code===targetLang?'rgba(99,102,241,0.3)':'transparent', border:'none', color: lang.code===targetLang?'#a5b4fc':'#e2e8f0', textAlign:'left', cursor:'pointer', fontSize:13, fontWeight: lang.code===targetLang?700:400 }}>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="tl-btn" onClick={() => setTooltip(null)}
            style={{ fontSize:14, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>✕</button>
        </div>
      </div>

      {/* Selected text */}
      <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:600 }}>SELECTED</div>
        <p style={{ margin:0, fontSize:13, color:'#cbd5e1', lineHeight:1.6, fontStyle:'italic',
          display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          "{tooltip.text}"
        </p>
      </div>

      {/* Translation result */}
      <div style={{ padding:'10px 14px 12px' }}>
        <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:600 }}>
          {LANGUAGES.find(l=>l.code===targetLang)?.label.toUpperCase()}
        </div>
        {tooltip.loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'#94a3b8', fontSize:13 }}>
            <span style={{ display:'inline-block', width:14, height:14, border:'2px solid #94a3b8', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Translating...
          </div>
        ) : (
          <p style={{ margin:0, fontSize:14, color:'#f1f5f9', lineHeight:1.7, fontWeight:500 }}>
            {tooltip.result || '—'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <button className="tl-btn"
          onClick={() => navigator.clipboard.writeText(tooltip.result || '')}
          style={{ flex:1, padding:'9px', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          📋 Copy
        </button>
        <button className="tl-btn"
          onClick={() => openGoogleTranslate(tooltip.text)}
          style={{ flex:1, padding:'9px', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600, borderLeft:'1px solid rgba(255,255,255,0.08)' }}>
          🌐 Google Translate
        </button>
        <button className="tl-btn"
          onClick={() => { const r=tooltip.result; if(r) { const el=document.createElement('div'); el.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;padding:8px 18px;border-radius:20px;font-size:13px;z-index:9998;pointer-events:none'; el.textContent='✓ Added to notes'; document.body.appendChild(el); setTimeout(()=>el.remove(),2000) } }}
          style={{ flex:1, padding:'9px', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600, borderLeft:'1px solid rgba(255,255,255,0.08)' }}>
          📝 Note
        </button>
      </div>
    </div>
  )
}
