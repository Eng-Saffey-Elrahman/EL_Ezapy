import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Building2,
  Printer,
  Download,
  DollarSign,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  Ban,
  Package
} from 'lucide-react';
import { reportService, branchService, medicineService, branchInventoryService } from '../services/api';
import { StatCard } from '../components/StatCard';

export const Reports = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [activeTab, setActiveTab] = useState('SALES'); // SALES | TOP_MEDS | INVENTORY_RISKS | INVOICES

  const [salesReport, setSalesReport] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    branchService.getAll().then((data) => setBranches(data));
    loadReports();
  }, [selectedBranch, startDate, endDate]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [salesData, meds, inv] = await Promise.all([
        reportService.getFilteredReports({ startDate, endDate, branchId: selectedBranch }),
        medicineService.getAll(),
        branchInventoryService.getBranchInventory(selectedBranch === 'ALL' ? 1 : Number(selectedBranch))
      ]);
      setSalesReport(salesData);
      setMedicines(meds);
      setInventoryList(inv);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for risks
  const today = new Date();
  const fortyFiveDays = new Date();
  fortyFiveDays.setDate(today.getDate() + 45);

  const expiredMeds = medicines.filter(
    (m) => m.status === 'Expired' || (m.expiry_date && new Date(m.expiry_date) < today)
  );

  const nearExpiryMeds = medicines.filter(
    (m) => m.status === 'Active' && m.expiry_date && new Date(m.expiry_date) >= today && new Date(m.expiry_date) <= fortyFiveDays
  );

  const lowStockItems = inventoryList.filter((i) => i.is_low_stock);

  return (
    <div>
      {/* Header & Print Action */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <BarChart3 size={24} color="var(--primary)" />
            <span>التقارير المالية والتحليلات الإدارية (Reports & Analytics)</span>
          </h1>
          <p className="page-header-desc">
            تقارير المبيعات، الفروع، الأصناف الأكثر مبيعاً، ورصد المخاطر ونواقص المخزون
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={18} />
            <span>طباعة التقرير (Print Report)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">الفرع المحدد:</label>
              <select
                className="form-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="ALL">جميع الفروع الموحدة</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '160px' }}>
              <label className="form-label">من تاريخ (Start Date):</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <label className="form-label">إلى تاريخ (End Date):</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(startDate || endDate || selectedBranch !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedBranch('ALL');
                }}
                style={{ height: '38px' }}
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {salesReport && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatCard
            title="إجمالي إيراد المبيعات"
            value={`${salesReport.totalRevenue.toLocaleString()} ج.م`}
            subtitle={`إجمالي ${salesReport.invoicesCount} فاتورة بيع`}
            icon={DollarSign}
            color="#059669"
            bg="#ecfdf5"
          />

          <StatCard
            title="إجمالي الخصومات الممنوحة"
            value={`${salesReport.totalDiscounts.toLocaleString()} ج.م`}
            subtitle="خصومات الأصناف للعملاء"
            icon={Receipt}
            color="#0284c7"
            bg="#f0f9ff"
          />

          <StatCard
            title="أدوية تحت حد الطلب"
            value={`${lowStockItems.length} صنف`}
            subtitle="نواقص تتطلب توريداً فورياً"
            icon={AlertTriangle}
            color="#dc2626"
            bg="#fef2f2"
          />

          <StatCard
            title="أدوية منتهية ومحرجة"
            value={`${expiredMeds.length + nearExpiryMeds.length} صنف`}
            subtitle={`${expiredMeds.length} منتهي | ${nearExpiryMeds.length} قريبة انتهاء`}
            icon={Ban}
            color="#d97706"
            bg="#fffbeb"
          />
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'SALES' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('SALES')}
          style={{ borderRadius: '6px 6px 0 0' }}
        >
          <span>تقرير الأدوية الأكثر مبيعاً</span>
        </button>
        <button
          className={`btn ${activeTab === 'INVOICES' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('INVOICES')}
          style={{ borderRadius: '6px 6px 0 0' }}
        >
          <span>سجل الفواتير التفصيلي</span>
        </button>
        <button
          className={`btn ${activeTab === 'INVENTORY_RISKS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('INVENTORY_RISKS')}
          style={{ borderRadius: '6px 6px 0 0' }}
        >
          <span>تقرير الصلاحيات والنواقص</span>
        </button>
      </div>

      {/* TAB 1: TOP SELLING MEDICINES */}
      {activeTab === 'SALES' && salesReport && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={20} color="var(--primary)" />
              <span>الأدوية الأكثر طلباً ومبيعاً (Top Selling Medicines)</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>الترتيب</th>
                  <th>اسم الدواء</th>
                  <th>الكميات المباعة</th>
                  <th>إجمالي العائد المالي</th>
                  <th>نسبة المساهمة في الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.topSelling.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      لا توجد بيانات مبيعات مسجلة في هذه الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  salesReport.topSelling.map((med, idx) => {
                    const percent = salesReport.totalRevenue > 0
                      ? Math.round((med.revenue / salesReport.totalRevenue) * 100)
                      : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{med.name}</td>
                        <td>
                          <span className="badge badge-success">{med.quantity} عبوة</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>{med.revenue.toFixed(2)} ج.م</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px' }}>
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  backgroundColor: 'var(--primary)',
                                  borderRadius: '3px'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES REPORT */}
      {activeTab === 'INVOICES' && salesReport && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Receipt size={20} color="var(--primary)" />
              <span>سجل الفواتير الصادرة</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>التاريخ والوقت</th>
                  <th>الفرع</th>
                  <th>الصيدلي المسؤول</th>
                  <th>العميل</th>
                  <th>طريقة الدفع</th>
                  <th>النوع</th>
                  <th>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                    <td>{inv.created_at}</td>
                    <td>{inv.branch_name}</td>
                    <td>{inv.employee_name}</td>
                    <td>{inv.customer_name}</td>
                    <td>{inv.payment_method}</td>
                    <td>
                      <span className={`badge ${inv.is_delivery ? 'badge-warning' : 'badge-neutral'}`}>
                        {inv.is_delivery ? 'توصيل منزلي' : 'بالصيدلية'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{inv.net_total.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPIRY & LOW STOCK RISKS */}
      {activeTab === 'INVENTORY_RISKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Low Stock Alert Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <AlertTriangle size={20} color="var(--danger)" />
                <span>أدوية تحت حد إعادة الطلب (Low Stock - Needs Reorder)</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>كود الدواء</th>
                    <th>اسم الدواء</th>
                    <th>الكمية المتبقية</th>
                    <th>حد إعادة الطلب</th>
                    <th>موقع الرف</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        لا توجد نواقص في المخزون حالياً لهذا الفرع.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item) => (
                      <tr key={item.id} className="row-danger">
                        <td style={{ fontWeight: 700 }}>{item.medicine_code}</td>
                        <td style={{ fontWeight: 700 }}>{item.medicine_name}</td>
                        <td style={{ fontWeight: 800, color: 'var(--danger)' }}>{item.quantity} عبوة</td>
                        <td>{item.reorder_level} عبوة</td>
                        <td>{item.shelf_location}</td>
                        <td>
                          <span className="badge badge-danger">يتطلب توريد عاجل</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expired and Near Expiry Medicines Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Clock size={20} color="var(--warning)" />
                <span>الأدوية المنتهية والقريبة من انتهاء الصلاحية</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>اسم الدواء</th>
                    <th>المورد المعتمد</th>
                    <th>سعر الجمهور</th>
                    <th>تاريخ الانتهاء</th>
                    <th>حالة الصلاحية</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expiredMeds, ...nearExpiryMeds].map((m) => {
                    const isExp = m.status === 'Expired' || new Date(m.expiry_date) < today;
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700 }}>{m.name}</td>
                        <td>{m.supplier_name}</td>
                        <td>{m.price.toFixed(2)} ج.م</td>
                        <td>{m.expiry_date}</td>
                        <td>
                          <span className={`badge ${isExp ? 'badge-danger' : 'badge-warning'}`}>
                            {isExp ? 'منتهي الصلاحية (Expired)' : 'ينتهي قريباً (خلال 45 يوماً)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
