import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Phone, Mail, MapPin, Award, History, ShoppingBag, Calendar } from 'lucide-react';
import { customerService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotify } from '../context/NotificationContext';

export const Customers = () => {
  const { success, error } = useNotify();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Purchase History Modal
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || ''
    });
    setIsModalOpen(true);
  };

  const handleViewHistory = async (customer) => {
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    try {
      const history = await customerService.getPurchaseHistory(customer.id);
      setCustomerInvoices(history);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      error('يرجى إدخال اسم العميل ورقم هاتفه');
      return;
    }

    setActionLoading(true);
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, formData);
        success('تم تحديث بيانات العميل بنجاح');
      } else {
        await customerService.create(formData);
        success('تم تسجيل العميل الجديد بنجاح');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      error(err.message || 'فشلت عملية حفظ العميل');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await customerService.delete(deleteId);
      success('تم حذف العميل بنجاح');
      setDeleteId(null);
      loadCustomers();
    } catch (err) {
      error(err.message || 'تعذر حذف العميل');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'اسم العميل',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary)" />
          <span>{row.name}</span>
        </div>
      )
    },
    {
      header: 'رقم الهاتف',
      accessor: 'phone',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Phone size={14} color="var(--text-muted)" />
          <span dir="ltr" style={{ fontWeight: 600 }}>{row.phone}</span>
        </div>
      )
    },
    {
      header: 'رصيد نقاط الولاء (Loyalty)',
      accessor: 'loyalty_points',
      render: (row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
            <Award size={14} />
            <span>{row.loyalty_points || 0} نقطة</span>
          </span>
        </div>
      )
    },
    {
      header: 'العنوان',
      accessor: 'address',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span>{row.address || '-'}</span>
        </div>
      )
    },
    {
      header: 'البريد الإلكتروني',
      accessor: 'email',
      render: (row) => <span style={{ fontSize: '0.825rem' }}>{row.email || '-'}</span>
    },
    {
      header: 'سجل المشتريات والإجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleViewHistory(row)}
            title="عرض فواتير العميل"
          >
            <History size={14} color="var(--primary)" />
            <span>الفواتير</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenEdit(row)}
            title="تعديل بيانات العميل"
          >
            <Edit2 size={14} />
            <span>تعديل</span>
          </button>
          <button
            className="btn btn-danger-light btn-sm"
            onClick={() => setDeleteId(row.id)}
            title="حذف العميل"
          >
            <Trash2 size={14} />
            <span>حذف</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <Users size={24} color="var(--primary)" />
            <span>إدارة العملاء ونقاط الولاء (Customers & Loyalty)</span>
          </h1>
          <p className="page-header-desc">
            سجل العملاء، عناوين التوصيل، وبرنامج نقاط المكافآت التراكمي المحسوب تلقائياً مع الفواتير
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>تسجيل عميل جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          searchPlaceholder="بحث باسم العميل، رقم الهاتف، أو العنوان..."
          emptyMessage="لا يوجد عملاء مسجلون"
        />
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : (editingCustomer ? 'حفظ التعديلات' : 'تسجيل العميل')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              اسم العميل بالكامل <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="مثال: أحمد عبد الرحمن"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                رقم الهاتف (للبحث في الـ POS) <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="01009876543"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-control"
                placeholder="customer@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">عنوان التوصيل والمنزل</label>
            <input
              type="text"
              className="form-control"
              placeholder="مثال: 15 شارع النزهة، مدينة نصر، الدور الرابع"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {editingCustomer && (
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              رصيد نقاط الولاء الحالي: <strong>{editingCustomer.loyalty_points || 0} نقطة</strong> (تُحسب تلقائياً من عمليات الشراء ولا يمكن تعديلها يدوياً لحماية أمان النظام).
            </div>
          )}
        </form>
      </Modal>

      {/* Customer Purchase History Modal */}
      <Modal
        isOpen={Boolean(historyCustomer)}
        onClose={() => setHistoryCustomer(null)}
        title={`سجل مشتريات العميل: ${historyCustomer?.name || ''}`}
        size="lg"
      >
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>جاري جلب الفواتير...</div>
        ) : customerInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            لم يقم هذا العميل بإجراء أي عمليات شراء سابقة حتى الآن.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>
                إجمالي الفواتير المسجلة: {customerInvoices.length} فاتورة
              </span>
              <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>
                رصيد النقاط: {historyCustomer?.loyalty_points || 0} نقطة
              </span>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ والوقت</th>
                    <th>الفرع</th>
                    <th>الأصناف المشتراة</th>
                    <th>طريقة الدفع</th>
                    <th>صافي القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                      <td>{inv.created_at}</td>
                      <td>{inv.branch_name}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {inv.items.map((it) => (
                            <div key={it.item_id}>• {it.medicine_name} (×{it.quantity})</div>
                          ))}
                        </div>
                      </td>
                      <td>{inv.payment_method}</td>
                      <td style={{ fontWeight: 800 }}>{inv.net_total.toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف العميل"
        message="هل أنت متأكد من رغبتك في حذف هذا العميل وسجل بياناته؟"
        loading={actionLoading}
      />
    </div>
  );
};
