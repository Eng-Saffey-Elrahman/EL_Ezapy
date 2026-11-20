import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cross, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useNotify();

  const [username, setUsername] = useState('safy.alrahman');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login({ username, password });
      success(`مرحباً بك، ${user.name} (${user.role_ar})`);
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول، تحقق من البيانات');
      error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname) => {
    setUsername(uname);
    setPassword('123456');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
          padding: '2.25rem 2rem 2rem',
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Cross size={32} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>El Ezaby Pharmacy</h2>
          <p style={{ fontSize: '0.85rem', color: '#a7f3d0', marginTop: '0.35rem' }}>
            صيدليات العزبي - بوابة إدارة الفروع والمبيعات
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '2rem' }}>
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger-border)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                اسم المستخدم / البريد الإلكتروني / الرقم القومي <span className="required">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon-right">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  className="form-control input-with-icon-right"
                  placeholder="مثال: safy.alrahman"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                كلمة المرور <span className="required">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon-right">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  className="form-control input-with-icon-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>تسجيل الدخول للنظام</span>
                  <ArrowLeft size={18} />
                </div>
              )}
            </button>
          </form>

          {/* Quick Preset Selector for Demo Presentation */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              حسابات تجريبية سريعة للمناقشة والعرض:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('safy.alrahman')}
                title="مدير فرع مدينة نصر الرئيسي"
              >
                د. صفي الرحمن (مدير فرع)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('emp2')}
                title="صيدلي أول - فرع مدينة نصر"
              >
                د. محمد أحمد (صيدلي أول)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('emp5')}
                title="كاشير مبيعات رئيسي"
              >
                أحمد شريف (كاشير رئيسي)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
