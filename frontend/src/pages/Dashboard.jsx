import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Receipt,
  Users,
  Package,
  AlertTriangle,
  Clock,
  Ban,
  Building2,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/api';
import { StatCard } from '../components/StatCard';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user?.branch_id]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const stats = await reportService.getDashboardData(user?.branch_id || 1);
      setData(stats);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '36px', height: '36px' }} />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>جاري استخراج المؤشرات والإحصائيات من قاعدة البيانات...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <span>لوحة التحكم والمؤشرات الإدارية</span>
          </h1>
          <p className="page-header-desc">
            متابعة حية وشاملة لمبيعات اليوم، حالة المخزون، وتنبيهات الأدوية في {user?.branch_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/pos" className="btn btn-primary">
            <ShoppingCart size={18} />
            <span>فتح شاشة البيع POS</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (8 Required Metrics) */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {/* 1. إجمالي مبيعات اليوم */}
        <StatCard
          title="إجمالي مبيعات اليوم"
          value={`${data.totalSalesToday.toLocaleString()} ج.م`}
          subtitle="تحديث لحظي من فواتير البيع"
          icon={DollarSign}
          color="#059669"
          bg="#ecfdf5"
        />

        {/* 2. عدد فواتير اليوم */}
        <StatCard
          title="عدد فواتير اليوم"
          value={`${data.todayInvoicesCount} فاتورة`}
          subtitle="مبيعات نقدية وإلكترونية"
          icon={Receipt}
          color="#0284c7"
          bg="#f0f9ff"
        />

        {/* 3. عدد العملاء المسجلين */}
        <StatCard
          title="إجمالي العملاء"
          value={`${data.totalCustomersCount} عميل`}
          subtitle="برنامج نقاط الولاء النشط"
          icon={Users}
          color="#7c3aed"
          bg="#f5f3ff"
        />

        {/* 4. عدد الأدوية بالمخزون */}
        <StatCard
          title="إجمالي العبوات بالفرع"
          value={`${data.totalMedicinesStock} عبوة`}
          subtitle="متاحة على الرفوف للبيع"
          icon={Package}
          color="#0d9488"
          bg="#f0fdfa"
        />
      </div>

      {/* Secondary Status & Risk KPI Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {/* 5. أدوية قاربت على النفاد */}
        <StatCard
          title="أدوية قاربت على النفاد"
          value={`${data.lowStockCount} دواء`}
          subtitle="وصلت لحد إعادة الطلب"
          icon={AlertTriangle}
          color="#dc2626"
          bg="#fef2f2"
        />

        {/* 6. أدوية قريبة من الانتهاء */}
        <StatCard
          title="أدوية قريبة الانتهاء"
          value={`${data.nearExpiryCount} دواء`}
          subtitle="خلال الـ 45 يوماً القادمة"
          icon={Clock}
          color="#d97706"
          bg="#fffbeb"
        />

        {/* 7. أدوية منتهية الصلاحية */}
        <StatCard
          title="أدوية منتهية الصلاحية"
          value={`${data.expiredCount} دواء`}
          subtitle="محظور بيعها في الـ POS"
          icon={Ban}
          color="#e11d48"
          bg="#ffe4e6"
        />

        {/* 8. طلبات توصيل قيد الانتظار */}
        <StatCard
          title="توصيل قيد التنفيذ"
          value={`${data.pendingDeliveries} طلب`}
          subtitle="توصيل للمنازل بالسيارة"
          icon={TrendingUp}
          color="#2563eb"
          bg="#eff6ff"
        />
      </div>

      {/* Middle Section: Branch Sales & Alerts */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Branch Sales Performance Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={20} color="var(--primary)" />
              <span>إجمالي المبيعات حسب الفروع</span>
            </div>
            <Link to="/reports" className="btn btn-secondary btn-sm">
              <span>تقرير تفصيلي</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.branchSales.map((b) => {
                const maxSales = Math.max(...data.branchSales.map(x => x.total_sales), 1);
                const percent = Math.min(100, Math.round((b.total_sales / maxSales) * 100));
                return (
                  <div key={b.branch_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{b.branch_name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>
                        {b.total_sales.toLocaleString()} ج.م ({b.invoices_count} فاتورة)
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Alerts & Reorder Level Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={20} color="var(--danger)" />
              <span>تنبيهات نقص المخزون (Reorder Level)</span>
            </div>
            <Link to="/branch-inventory" className="btn btn-secondary btn-sm">
              <span>عرض المخزون</span>
            </Link>
          </div>
          <div className="card-body" style={{ padding: '0.5rem 1.25rem' }}>
            {data.lowStockAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                لا توجد نواقص مخزون حرجة حالياً في هذا الفرع.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.lowStockAlerts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        الرف: <strong>{item.shelf_location}</strong> | حد الطلب: {item.reorder_level} عبوة
                      </div>
                    </div>
                    <div>
                      <span className="badge badge-danger">
                        المتبقي: {item.quantity} فقط!
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Receipt size={20} color="var(--primary)" />
            <span>آخر الفواتير المسجلة</span>
          </div>
          <Link to="/reports" className="btn btn-secondary btn-sm">
            <span>سجل الفواتير الكامل</span>
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ والوقت</th>
                <th>الفرع</th>
                <th>الموظف</th>
                <th>العميل</th>
                <th>طريقة الدفع</th>
                <th>نوع الطلب</th>
                <th>صافي المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                  <td>{inv.created_at}</td>
                  <td>{inv.branch_name}</td>
                  <td>{inv.employee_name}</td>
                  <td>{inv.customer_name}</td>
                  <td>
                    <span className={`badge ${inv.payment_method === 'Cash' ? 'badge-neutral' : 'badge-info'}`}>
                      {inv.payment_method === 'Cash' ? 'نقدي' : 'بطاقة إلكترونية'}
                    </span>
                  </td>
                  <td>
                    {inv.is_delivery ? (
                      <span className="badge badge-warning">توصيل منزلي</span>
                    ) : (
                      <span className="badge badge-neutral">استلام بالصيدلية</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {inv.net_total.toFixed(2)} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
