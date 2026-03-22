// src/lib/translate.js
// Inline translation using MyMemory free API (no key needed, 1000 req/day)
// Falls back to Google Translate web URL

export async function translateText(text, targetLang = 'vi', sourceLang = 'en') {
  if (!text || text.trim().length < 2) return text

  try {
    const encoded = encodeURIComponent(text.slice(0, 500))
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|${targetLang}`
    )
    const data = await res.json()
    if (data.responseStatus === 200) {
      return data.responseData.translatedText
    }
    throw new Error('Translation failed')
  } catch {
    // Fallback: open Google Translate in new tab
    return null
  }
}

export function openGoogleTranslate(text) {
  const url = `https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(text)}&op=translate`
  window.open(url, '_blank', 'width=700,height=500')
}

export const LANGUAGES = [
  { code:'vi', label:'🇻🇳 Vietnamese' },
  { code:'zh', label:'🇨🇳 Chinese' },
  { code:'ja', label:'🇯🇵 Japanese' },
  { code:'ko', label:'🇰🇷 Korean' },
  { code:'th', label:'🇹🇭 Thai' },
  { code:'id', label:'🇮🇩 Indonesian' },
  { code:'fr', label:'🇫🇷 French' },
  { code:'es', label:'🇪🇸 Spanish' },
]
