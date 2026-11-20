import React, { useState, useEffect } from 'react';
import { Pill, Plus, Edit2, Trash2, Calendar, Tag, AlertCircle } from 'lucide-react';
import { medicineService, supplierService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotify } from '../context/NotificationContext';

export const Medicines = () => {
  const { success, error } = useNotify();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'مسكنات وخافض حرارة',
    dosage_form: 'أقراص',
    supplier_id: '',
    price: '',
    cost_price: '',
    expiry_date: '',
    barcode: '',
    initial_central_qty: '100'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meds, sups] = await Promise.all([
        medicineService.getAll(),
        supplierService.getAll()
      ]);
      setMedicines(meds);
      setSuppliers(sups);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      code: '',
      category: 'مسكنات وخافض حرارة',
      dosage_form: 'أقراص',
      supplier_id: suppliers[0]?.id || '',
      price: '',
      cost_price: '',
      expiry_date: '',
      barcode: '',
      initial_central_qty: '100'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      code: med.code,
      category: med.category,
      dosage_form: med.dosage_form,
      supplier_id: med.supplier_id,
      price: med.price,
      cost_price: med.cost_price || '',
      expiry_date: med.expiry_date || '',
      barcode: med.barcode || '',
      initial_central_qty: '0'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.supplier_id) {
      error('يرجى ملء جميع الحقول الإجبارية واختيار المورد');
      return;
    }

    setActionLoading(true);
    try {
      if (editingMedicine) {
        await medicineService.update(editingMedicine.id, formData);
        success('تم تحديث بيانات الدواء بنجاح');
      } else {
        await medicineService.create(formData);
        success('تمت إضافة الدواء بنجاح للمنظومة والمخزن المركزي');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      error(err.message || 'حدث خطأ أثناء حفظ الدواء');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await medicineService.delete(deleteId);
      success('تم حذف الدواء من النظام بنجاح');
      setDeleteId(null);
      loadData();
    } catch (err) {
      error(err.message || 'تعذر حذف الدواء');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'كود الدواء',
      accessor: 'code',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.code}</span>
    },
    {
      header: 'اسم الدواء والشكل الصيدلي',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.dosage_form} • {row.category}
          </div>
        </div>
      )
    },
    {
      header: 'المورد (Supplier FK)',
      accessor: 'supplier_name',
      render: (row) => <span style={{ color: 'var(--text-secondary)' }}>{row.supplier_name}</span>
    },
    {
      header: 'سعر البيع للجمهور',
      accessor: 'price',
      render: (row) => (
        <span style={{ fontWeight: 800, color: 'var(--primary-hover)' }}>
          {Number(row.price).toFixed(2)} ج.م
        </span>
      )
    },
    {
      header: 'سعر التكلفة',
      accessor: 'cost_price',
      render: (row) => (
        <span style={{ color: 'var(--text-muted)' }}>
          {row.cost_price ? `${Number(row.cost_price).toFixed(2)} ج.م` : '-'}
        </span>
      )
    },
    {
      header: 'تاريخ الصلاحية',
      accessor: 'expiry_date',
      render: (row) => {
        const isExpired = row.status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < new Date());
        return (
          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-neutral'}`}>
            <Calendar size={12} />
            <span>{row.expiry_date}</span>
          </span>
        );
      }
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (row) => (
        <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
          {row.status === 'Active' ? 'صالح ومتاح' : 'منتهي الصلاحية'}
        </span>
      )
    },
    {
      header: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(row)} title="تعديل الدواء">
            <Edit2 size={14} />
            <span>تعديل</span>
          </button>
          <button className="btn btn-danger-light btn-sm" onClick={() => setDeleteId(row.id)} title="حذف الدواء">
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
            <Pill size={24} color="var(--primary)" />
            <span>دليل وتسجيل الأدوية (Medicines Master Catalog)</span>
          </h1>
          <p className="page-header-desc">
            إدارة كافة الأصناف الدوائية والأسعار وتواريخ الصلاحية والربط مع الموردين
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>إضافة صنف دواء جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={medicines}
          loading={loading}
          searchPlaceholder="بحث باسم الدواء، الكود، الفئة، أو المورد..."
          emptyMessage="لا توجد أدوية مسجلة بالنظام"
        />
      </div>

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMedicine ? 'تعديل بيانات الدواء' : 'إضافة دواء جديد للدليل'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : (editingMedicine ? 'حفظ التعديلات' : 'تسجيل الدواء')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                اسم الدواء التجاري الكامل <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="مثال: Augmentin 1g Tablets"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">كود الدواء (Medicine Code)</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثال: MED-1002"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">
                المورد (Foreign Key Dropdown) <span className="required">*</span>
              </label>
              <select
                required
                className="form-select"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">-- اختر المورد المعتمد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">التصنيف الدوائي</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="مسكنات وخافض حرارة">مسكنات وخافض حرارة</option>
                <option value="مضادات حيوية">مضادات حيوية</option>
                <option value="أدوية القلب والضغط">أدوية القلب والضغط</option>
                <option value="أدوية السكري">أدوية السكري</option>
                <option value="أدوية الجهاز الهضمي">أدوية الجهاز الهضمي</option>
                <option value="فيتامينات ومقويات">فيتامينات ومقويات</option>
                <option value="أدوية أطفال">أدوية أطفال</option>
                <option value="مستلزمات طبية">مستلزمات طبية</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">الشكل الصيدلي</label>
              <select
                className="form-select"
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
              >
                <option value="أقراص">أقراص (Tablets)</option>
                <option value="كبسولات">كبسولات (Capsules)</option>
                <option value="شراب">شراب (Syrup)</option>
                <option value="حقن">حقن (Injections)</option>
                <option value="فوار">فوار (Granules)</option>
                <option value="مرهم / كريم">مرهم / كريم (Ointment)</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">
                سعر بيع الجمهور (ج.م) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                className="form-control"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">سعر التكلفة / الشراء (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                تاريخ انتهاء الصلاحية <span className="required">*</span>
              </label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">الباركود الدولي (Barcode)</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثال: 622123456001"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            {!editingMedicine && (
              <div className="form-group">
                <label className="form-label">رصيد مبدئي بالمخزن المركزي</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="100"
                  value={formData.initial_central_qty}
                  onChange={(e) => setFormData({ ...formData, initial_central_qty: e.target.value })}
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الدواء"
        message="هل أنت متأكد من حذف هذا الدواء؟ سيتم حذفه من دليل الأدوية والمخازن التابعة له."
        loading={actionLoading}
      />
    </div>
  );
};
