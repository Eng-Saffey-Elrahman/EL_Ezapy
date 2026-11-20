import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Edit2, Trash2, Phone, MapPin, Warehouse, UserCheck, Calendar } from 'lucide-react';
import { branchService, warehouseService, employeeService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotify } from '../context/NotificationContext';

export const Branches = () => {
  const { success, error } = useNotify();
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    warehouse_id: '',
    manager_id: '',
    start_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [brs, whs, emps] = await Promise.all([
        branchService.getAll(),
        warehouseService.getAllWarehouses(),
        employeeService.getAll()
      ]);
      setBranches(brs);
      setWarehouses(whs || []);
      setEmployees(emps);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      warehouse_id: warehouses[0]?.id || 1,
      manager_id: employees[0]?.id || 1,
      start_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBranch(b);
    setFormData({
      name: b.name,
      address: b.address,
      phone: b.phone,
      warehouse_id: b.warehouse_id,
      manager_id: b.manager_id,
      start_date: b.start_date || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.phone.trim()) {
      error('يرجى ملء جميع البيانات الأساسية للفرع');
      return;
    }

    setActionLoading(true);
    try {
      if (editingBranch) {
        await branchService.update(editingBranch.id, formData);
        success('تم تحديث بيانات الفرع بنجاح');
      } else {
        await branchService.create(formData);
        success('تمت إضافة الفرع الجديد بنجاح');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      error(err.message || 'فشلت عملية حفظ الفرع');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await branchService.delete(deleteId);
      success('تم حذف الفرع بنجاح');
      setDeleteId(null);
      loadData();
    } catch (err) {
      error(err.message || 'تعذر حذف الفرع');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'اسم الفرع',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitBranch size={18} color="var(--primary)" />
          <span>{row.name}</span>
        </div>
      )
    },
    {
      header: 'العنوان',
      accessor: 'address',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span>{row.address}</span>
        </div>
      )
    },
    {
      header: 'رقم الهاتف',
      accessor: 'phone',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Phone size={14} color="var(--text-muted)" />
          <span dir="ltr">{row.phone}</span>
        </div>
      )
    },
    {
      header: 'المخزن المغذي (Warehouse FK)',
      accessor: 'warehouse_name',
      render: (row) => (
        <span className="badge badge-neutral" style={{ display: 'inline-flex', gap: '0.35rem' }}>
          <Warehouse size={12} />
          <span>{row.warehouse_name}</span>
        </span>
      )
    },
    {
      header: 'مدير الفرع (Manager FK)',
      accessor: 'manager_name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <UserCheck size={14} color="var(--primary)" />
          <span>{row.manager_name}</span>
        </div>
      )
    },
    {
      header: 'تاريخ بداية الإدارة',
      accessor: 'start_date',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <Calendar size={13} />
          <span>{row.start_date || '-'}</span>
        </div>
      )
    },
    {
      header: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(row)} title="تعديل الفرع">
            <Edit2 size={14} />
            <span>تعديل</span>
          </button>
          <button className="btn btn-danger-light btn-sm" onClick={() => setDeleteId(row.id)} title="حذف الفرع">
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
            <GitBranch size={24} color="var(--primary)" />
            <span>إدارة الفروع (Branches Management)</span>
          </h1>
          <p className="page-header-desc">
            إدارة شبكة فروع الصيدليات وربطها بالمخازن المركزية والمديرين التنفيذيين
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>إضافة فرع جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={branches}
          loading={loading}
          searchPlaceholder="بحث باسم الفرع، العنوان، أو المدير..."
          emptyMessage="لا توجد فروع مسجلة"
        />
      </div>

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع صيدلية جديد'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : (editingBranch ? 'حفظ التعديلات' : 'تسجيل الفرع')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              اسم الفرع <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="مثال: فرع مدينة نصر (الرئيسي)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                العنوان التفصيلي <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="مثال: 24 شارع عباس العقاد، القاهرة"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                رقم هاتف الفرع <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="0222718901"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                المخزن المغذي (Warehouse FK) <span className="required">*</span>
              </label>
              <select
                required
                className="form-select"
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                مدير الفرع (Manager FK) <span className="required">*</span>
              </label>
              <select
                required
                className="form-select"
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role_ar})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">تاريخ بداية الإدارة والتشغيل</label>
            <input
              type="date"
              className="form-control"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الفرع"
        message="هل أنت متأكد من رغبتك في حذف هذا الفرع؟ تأكد من عدم وجود موظفين أو مخزون تابع له."
        loading={actionLoading}
      />
    </div>
  );
};
