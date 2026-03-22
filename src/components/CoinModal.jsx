// src/components/CoinModal.jsx
// Trong thực tế: tích hợp VNPay / Momo webhook để cộng xu sau khi thanh toán
export default function CoinModal({ currentCoins, onClose, onPurchase }) {
  const packages = [
    { coins: 20,  price: '10.000₫', bonus: '' },
    { coins: 50,  price: '20.000₫', bonus: '+5 xu' },
    { coins: 120, price: '45.000₫', bonus: '+20 xu 🔥' },
    { coins: 300, price: '99.000₫', bonus: '+80 xu ⚡' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36 }}>🪙</div>
          <h3 style={{ margin: '6px 0 4px', fontSize: 17, fontWeight: 800 }}>Nạp xu</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Hiện có: <strong style={{ color: '#f59e0b' }}>{currentCoins} xu</strong></p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {packages.map(pkg => (
            <button key={pkg.coins} onClick={() => onPurchase(pkg.coins)}
              style={{
                background: pkg.bonus.includes('🔥') ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : pkg.bonus.includes('⚡') ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : '#f8fafc',
                border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 10px',
                cursor: 'pointer', textAlign: 'center',
              }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{pkg.coins}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>xu</div>
              {pkg.bonus && <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>{pkg.bonus}</div>}
              <div style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginTop: 6 }}>{pkg.price}</div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 12 }}>Chọn phương thức thanh toán</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {['💳 VNPay', '📱 Momo', '💚 ZaloPay'].map(m => (
            <button key={m} style={{ flex: 1, padding: '9px 4px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, color: '#374151' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
              {m}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
          * Demo: click gói bất kỳ để nhận xu ngay.<br/>
          Thực tế: tích hợp VNPay/Momo webhook.
        </p>
      </div>
    </div>
  )
}
