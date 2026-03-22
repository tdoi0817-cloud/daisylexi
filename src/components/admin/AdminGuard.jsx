// src/components/admin/AdminGuard.jsx
// Bao bọc route — chặn nếu không đủ quyền
import { useAdmin } from '../../hooks/useAdmin'

export default function AdminGuard({ children, require = 'ctv' }) {
  const { user, loading, isAdmin, isCTV } = useAdmin()

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:40 }}>🐱</div>
      <p style={{ color:'#6b7280', marginTop:8 }}>Đang kiểm tra quyền truy cập...</p>
    </div>
  )

  if (!user) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <h3 style={{ margin:'12px 0 8px', fontWeight:800 }}>Bạn chưa đăng nhập</h3>
      <p style={{ color:'#6b7280', fontSize:14 }}>Vui lòng đăng nhập để tiếp tục.</p>
    </div>
  )

  const hasAccess = require === 'admin' ? isAdmin : isCTV
  if (!hasAccess) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48 }}>🚫</div>
      <h3 style={{ margin:'12px 0 8px', fontWeight:800 }}>Không có quyền truy cập</h3>
      <p style={{ color:'#6b7280', fontSize:14 }}>
        {require === 'admin'
          ? 'Trang này chỉ dành cho Admin.'
          : 'Trang này dành cho Cộng Tác Viên hoặc Admin.'}
      </p>
      <p style={{ fontSize:13, color:'#9ca3af' }}>Role hiện tại: <strong>{user.role || 'reader'}</strong></p>
    </div>
  )

  return children
}
