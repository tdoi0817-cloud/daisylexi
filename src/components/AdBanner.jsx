// src/components/AdBanner.jsx
export function AdBanner({ slot = 'top', client = import.meta.env.VITE_ADSENSE_CLIENT }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#fff8e1,#fff3cd)',
      border: '1px dashed #f59e0b',
      borderRadius: 10,
      padding: '10px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 12,
      color: '#92400e',
      margin: slot === 'inline' ? '16px 0' : '0 0 16px 0',
    }}>
      <span style={{ opacity: 0.7, fontSize: 10, background: '#f59e0b22', padding: '2px 7px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }}>Quảng cáo</span>
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
        {slot === 'top'
          ? '📢 Google AdSense Banner — thay bằng ad unit thật'
          : '📦 AdSense Responsive — giữa chapter'}
      </span>
    </div>

    /*
    === KHI CÓ ADSENSE THẬT, THAY BẰNG: ===
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot="XXXXXXXX"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
    <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
    */
  )
}
