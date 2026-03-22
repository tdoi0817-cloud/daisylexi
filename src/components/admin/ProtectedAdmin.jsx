// src/components/admin/ProtectedAdmin.jsx
import { useAdmin } from '../../hooks/useAdmin'

export default function ProtectedAdmin({ user, children, requireAdmin = false }) {
  const { role, loading, isAdmin, isCTV } = useAdmin(user)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <span style={{ fontSize:32 }}>🐱</span>
    </div>
  )

  if (!user) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
      <h2 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800 }}>Cần đăng nhập</h2>
      <p style={{ color:'#6b7280', fontSize:14 }}>Vui lòng đăng nhập để truy cập khu vực này.</p>
    </div>
  )

  const hasAccess = requireAdmin ? isAdmin : isCTV
  if (!hasAccess) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>⛔</div>
      <h2 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800 }}>Không có quyền truy cập</h2>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:16 }}>
        Khu vực này yêu cầu quyền <strong>{requireAdmin ? 'Admin' : 'Cộng Tác Viên'}</strong>.
      </p>
      <div style={{ background:'#f8fafc', borderRadius:10, padding:16, display:'inline-block', textAlign:'left', fontSize:13 }}>
        <p style={{ margin:'0 0 6px', fontWeight:700 }}>Quyền của bạn: <span style={{ color:'#6366f1' }}>{role}</span></p>
        <p style={{ margin:0, color:'#6b7280' }}>Liên hệ admin để được cấp quyền.</p>
      </div>
    </div>
  )

  return children
}
