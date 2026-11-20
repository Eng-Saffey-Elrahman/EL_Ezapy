import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Phone, Mail, MapPin, PlusCircle, MinusCircle } from 'lucide-react';
import { supplierService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotify } from '../context/NotificationContext';

export const Suppliers = () => {
  const { success, error } = useNotify();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phones: ['']
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      address: '',
      phones: ['']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      email: sup.email || '',
      address: sup.address || '',
      phones: sup.phones && sup.phones.length > 0 ? [...sup.phones] : ['']
    });
    setIsModalOpen(true);
  };

  const handlePhoneChange = (index, value) => {
    const updated = [...formData.phones];
    updated[index] = value;
    setFormData({ ...formData, phones: updated });
  };

  const handleAddPhoneField = () => {
    setFormData({ ...formData, phones: [...formData.phones, ''] });
  };

  const handleRemovePhoneField = (index) => {
    if (formData.phones.length === 1) return;
    const updated = formData.phones.filter((_, i) => i !== index);
    setFormData({ ...formData, phones: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('يرجى إدخال اسم المورد');
      return;
    }

    setActionLoading(true);
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
        success('تم تحديث بيانات المورد بنجاح');
      } else {
        await supplierService.create(formData);
        success('تمت إضافة المورد الجديد بنجاح');
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      error(err.message || 'فشلت عملية حفظ المورد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await supplierService.delete(deleteId);
      success('تم حذف المورد بنجاح');
      setDeleteId(null);
      loadSuppliers();
    } catch (err) {
      error(err.message || 'تعذر حذف المورد');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'اسم المورد / الشركة',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={18} color="var(--primary)" />
          <span>{row.name}</span>
        </div>
      )
    },
    {
      header: 'أرقام الهواتف',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {row.phones && row.phones.length > 0 ? (
            row.phones.map((phone, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
                <Phone size={13} color="var(--text-muted)" />
                <span dir="ltr">{phone}</span>
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-light)' }}>-</span>
          )}
        </div>
      )
    },
    {
      header: 'البريد الإلكتروني',
      accessor: 'email',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Mail size={14} color="var(--text-muted)" />
          <span>{row.email || '-'}</span>
        </div>
      )
    },
    {
      header: 'العنوان ومقر المصنع',
      accessor: 'address',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'normal' }}>{row.address || '-'}</span>
        </div>
      )
    },
    {
      header: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenEdit(row)}
            title="تعديل بيانات المورد"
          >
            <Edit2 size={14} />
            <span>تعديل</span>
          </button>
          <button
            className="btn btn-danger-light btn-sm"
            onClick={() => setDeleteId(row.id)}
            title="حذف المورد"
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
            <Truck size={24} color="var(--primary)" />
            <span>إدارة الموردين وشركات الأدوية (Suppliers)</span>
          </h1>
          <p className="page-header-desc">
            قائمة الموردين المعتمدين لتوريد الأدوية والمستلزمات الطبية للمخزن المركزي
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={suppliers}
          loading={loading}
          searchPlaceholder="بحث باسم المورد، البريد، أو رقم الهاتف..."
          emptyMessage="لا يوجد موردون مسجلون حالياً"
        />
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد أدوية جديد'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : (editingSupplier ? 'تحديث البيانات' : 'حفظ المورد')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              اسم المورد / الشركة <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="مثال: شركة إيبيكو للأدوية"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-control"
                placeholder="supply@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">عنوان الشركة / المخزن</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثال: المنطقة الصناعية، العبور"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Dynamic Multiple Phones Section as specifically instructed */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                أرقام الهواتف والتواصل <span className="required">*</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddPhoneField}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--primary)' }}
              >
                <PlusCircle size={14} />
                <span>إضافة رقم هاتف آخر (Add Phone)</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {formData.phones.map((phone, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    required={idx === 0}
                    className="form-control"
                    placeholder={`رقم الهاتف ${idx + 1}`}
                    value={phone}
                    onChange={(e) => handlePhoneChange(idx, e.target.value)}
                    dir="ltr"
                  />
                  {formData.phones.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger-light btn-icon"
                      onClick={() => handleRemovePhoneField(idx)}
                      title="حذف هذا الرقم"
                    >
                      <MinusCircle size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
              يمكنك إضافة أكثر من رقم تليفون وفقاً لتصميم قاعدة البيانات متعددة الهواتف.
            </small>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف المورد"
        message="هل أنت متأكد من رغبتك في حذف هذا المورد؟ سيتم التحقق من قيود قاعدة البيانات لضمان عدم وجود أدوية مرتبطة به."
        loading={actionLoading}
      />
    </div>
  );
};
