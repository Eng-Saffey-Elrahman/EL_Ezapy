import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Warehouse,
  Pill,
  Truck,
  Users,
  TruckIcon,
  GitBranch,
  UserCheck,
  BarChart3,
  LogOut,
  Cross,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { section: 'الرئيسية والمبيعات' },
    { to: '/', label: 'لوحة التحكم Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'نقطة البيع السريعة POS', icon: ShoppingCart, highlight: true },
    { to: '/delivery', label: 'طلبات التوصيل Delivery', icon: Truck },

    { section: 'المخزون والمنتجات' },
    { to: '/branch-inventory', label: 'مخزون الفرع Inventory', icon: Boxes },
    { to: '/medicines', label: 'دليل الأدوية Medicines', icon: Pill },
    { to: '/central-warehouse', label: 'المخزن المركزي Warehouse', icon: Warehouse },
    { to: '/suppliers', label: 'الموردون Suppliers', icon: TruckIcon },

    { section: 'إدارة الفروع والموظفين' },
    { to: '/customers', label: 'العملاء ونقاط الولاء', icon: Users },
    { to: '/branches', label: 'الفروع Branches', icon: GitBranch },
    { to: '/employees', label: 'فريق العمل Employees', icon: UserCheck },

    { section: 'الإحصائيات' },
    { to: '/reports', label: 'التقارير المالية والتحليلات', icon: BarChart3 }
  ];

  // Pure classes for CSS to handle:
  // Desktop: .collapsed hides sidebar, .open shows it
  // Mobile: .open shows drawer overlay, default hidden
  const sidebarClasses = `sidebar ${!isOpen ? 'collapsed' : 'open'}`;

  return (
    <>
      {/* Backdrop overlay (CSS handles visibility: only displays on screens <= 1024px when open) */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-label="إغلاق القائمة" />
      )}

      <aside className={sidebarClasses}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Cross size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em' }}>
                El Ezaby Pharmacy
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                صيدليات العزبي المتكاملة
              </div>
            </div>
          </div>

          {/* Quick close button in sidebar header */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            title="إخفاء القائمة الجانبية"
            aria-label="إخفاء القائمة الجانبية"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={index} className="sidebar-section-title">
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  // If on mobile (screen <= 1024px), close sidebar when link is clicked
                  if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                    onClose();
                  }
                }}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={item.highlight ? { border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' } : {}}
              >
                <div className="nav-link-content">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name.charAt(0)}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">
                  <span>{user.role_ar || user.role}</span>
                  <span>•</span>
                  <span>{user.branch_name?.split(' ')[1] || 'الفرع'}</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="تسجيل الخروج"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
