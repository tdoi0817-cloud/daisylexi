// netlify/functions/claude-proxy.js
// Serverless function chạy server-side → không bị CORS
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const CLAUDE_KEY = process.env.CLAUDE_API_KEY
  if (!CLAUDE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'CLAUDE_API_KEY not set in Netlify env vars' }) }
  }

  try {
    const body = JSON.parse(event.body)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
