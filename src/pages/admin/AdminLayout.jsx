// src/pages/admin/AdminLayout.jsx
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import ProtectedAdmin from '../../components/admin/ProtectedAdmin'

const MENU = [
  { path:'/admin',          label:'📊 Tổng quan',      adminOnly: false },
  { path:'/admin/stories',  label:'📚 Quản lý truyện', adminOnly: false },
  { path:'/admin/users',    label:'👥 Phân quyền',      adminOnly: true  },
]

export default function AdminLayout({ user }) {
  const location = useLocation()
  const { isAdmin } = useAdmin(user)

  return (
    <ProtectedAdmin user={user}>
      <div style={{ display:'flex', gap:0, minHeight:'calc(100vh - 120px)' }}>
        {/* Sidebar */}
        <div style={{ width:200, flexShrink:0, background:'#fff', borderRight:'1px solid #e2e8f0', padding:'16px 0' }}>
          <div style={{ padding:'0 16px 16px', borderBottom:'1px solid #f1f5f9', marginBottom:8 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>⚙️ Quản trị</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Mèo Kam Mập CMS</div>
          </div>
          {MENU.filter(m => !m.adminOnly || isAdmin).map(m => {
            const active = location.pathname === m.path
            return (
              <Link key={m.path} to={m.path}
                style={{ display:'block', padding:'10px 16px', textDecoration:'none', fontSize:13, fontWeight:600,
                  color:      active?'#6366f1':'#374151',
                  background: active?'#ede9fe':'transparent',
                  borderLeft: active?'3px solid #6366f1':'3px solid transparent',
                  transition:'all 0.15s' }}
                onMouseOver={e => { if(!active) e.currentTarget.style.background='#f8fafc' }}
                onMouseOut={e => { if(!active) e.currentTarget.style.background='transparent' }}>
                {m.label}
              </Link>
            )
          })}
          <div style={{ marginTop:'auto', padding:'16px 16px 0', borderTop:'1px solid #f1f5f9', marginTop:16 }}>
            <Link to="/" style={{ display:'block', fontSize:12, color:'#9ca3af', textDecoration:'none' }}>← Về trang chủ</Link>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0, padding:'20px', background:'#f8fafc' }}>
          <Outlet />
        </div>
      </div>
    </ProtectedAdmin>
  )
}
