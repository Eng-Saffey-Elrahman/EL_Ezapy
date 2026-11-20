import React, { useState } from 'react';
import {
  Menu,
  Building2,
  User,
  ShoppingCart,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Sun,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Modal } from '../components/Modal';

export const Navbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { user, branches, switchBranch } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="top-navbar">
        {/* Right side in RTL: Sidebar Toggle + Branch Selector */}
        <div className="navbar-right-group">
          {/* Dedicated Sidebar Toggle Button (Always Visible & Prominent) */}
          <button
            type="button"
            className={`sidebar-toggle-btn ${!sidebarOpen ? 'is-collapsed' : ''}`}
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'إخفاء القائمة الجانبية (Collapse Sidebar)' : 'إظهار القائمة الجانبية (Expand Sidebar)'}
            aria-label="تبديل القائمة الجانبية"
          >
            {sidebarOpen ? (
              <PanelRightClose size={18} color="var(--primary)" />
            ) : (
              <PanelRightOpen size={18} color="var(--primary)" />
            )}
            <span>{sidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}</span>
          </button>

          {/* Branch Switcher & Indicator */}
          {user && (
            <div className="current-branch-pill">
              <Building2 size={16} />
              <span>الفرع:</span>
              <select
                value={user.branch_id}
                onChange={(e) => switchBranch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 700,
                  color: 'inherit',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="تغيير الفرع الحالي للتجربة"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} style={{ color: '#0f172a' }}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Left side in RTL: POS Shortcut, Dark Mode, Notifications, Profile */}
        <div className="navbar-left-group">
          <Link to="/pos" className="btn btn-primary btn-sm" style={{ gap: '0.4rem' }}>
            <ShoppingCart size={16} />
            <span className="btn-pos-text">نقطة البيع POS</span>
          </Link>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={toggleTheme}
            title={isDark ? 'تفعيل المظهر الفاتح (Light Mode)' : 'تفعيل المظهر الليلي (Dark Mode)'}
            aria-label="تبديل الوضع الليلي"
          >
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(true)}
            title="التنبيهات والإشعارات"
          >
            <Bell size={18} />
            <span className="notification-badge">3</span>
          </button>

          {/* User Profile Info */}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingLeft: '0.5rem',
                borderLeft: '1px solid var(--border)'
              }}
            >
              <div className="user-name-text" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary-hover)', fontWeight: 600 }}>
                  {user.role_ar || user.role}
                </div>
              </div>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                <User size={18} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Quick Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="تنبيهات النظام الفورية"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.85rem',
              backgroundColor: 'var(--danger-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger-border)'
            }}
          >
            <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
                تنبيه نقص المخزون (Reorder Level)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.2rem' }}>
                دواء <strong>Augmentin 1g Tablets</strong> وصل إلى 8 عبوات (الحد الأدنى 10 عبوات).
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.85rem',
              backgroundColor: 'var(--warning-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--warning-border)'
            }}
          >
            <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>
                دواء شارف على انتهاء الصلاحية
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '0.2rem' }}>
                دواء <strong>Augmentin 1g Tablets</strong> ينتهي بتاريخ 2026-12-30 (خلال أقل من 45 يوماً).
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.85rem',
              backgroundColor: 'var(--success-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success-border)'
            }}
          >
            <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#065f46' }}>
                مزامنة صيدليات العزبي
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.2rem' }}>
                النظام يعمل بكامل طاقته ومتاح للتجربة المتجاوبة على شاشات الكمبيوتر واللابتوب والموبايل.
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
