import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Phone, Mail, MapPin, Building2, Shield, CreditCard } from 'lucide-react';
import { employeeService, branchService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotify } from '../context/NotificationContext';

export const Employees = () => {
  const { success, error } = useNotify();
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    phone: '',
    email: '',
    address: '',
    role: 'Pharmacist',
    branch_id: '',
    username: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, brs] = await Promise.all([
        employeeService.getAll(),
        branchService.getAll()
      ]);
      setEmployees(emps);
      setBranches(brs);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      national_id: '',
      phone: '',
      email: '',
      address: '',
      role: 'Pharmacist',
      branch_id: branches[0]?.id || '',
      username: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      national_id: emp.national_id,
      phone: emp.phone,
      email: emp.email,
      address: emp.address,
      role: emp.role,
      branch_id: emp.branch_id,
      username: emp.username || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.national_id.trim() || !formData.branch_id) {
      error('يرجى ملء الاسم والرقم القومي واختيار الفرع التابع له');
      return;
    }

    if (formData.national_id.trim().length !== 14) {
      error('الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً');
      return;
    }

    setActionLoading(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, formData);
        success('تم تحديث بيانات الموظف بنجاح');
      } else {
        await employeeService.create(formData);
        success('تمت إضافة الموظف الجديد للنظام بنجاح');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      error(err.message || 'فشلت عملية حفظ الموظف');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await employeeService.delete(deleteId);
      success('تم حذف الموظف بنجاح');
      setDeleteId(null);
      loadData();
    } catch (err) {
      error(err.message || 'تعذر حذف الموظف');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Manager':
        return <span className="badge badge-success">مدير فرع</span>;
      case 'Cashier':
        return <span className="badge badge-info">كاشير ومبيعات</span>;
      case 'Driver':
        return <span className="badge badge-warning">سائق توصيل</span>;
      default:
        return <span className="badge badge-neutral">صيدلي</span>;
    }
  };

  const columns = [
    {
      header: 'اسم الموظف',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مستخدم: {row.username}</div>
        </div>
      )
    },
    {
      header: 'الرقم القومي (Unique National ID)',
      accessor: 'national_id',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace' }}>
          <CreditCard size={14} color="var(--text-muted)" />
          <span>{row.national_id}</span>
        </div>
      )
    },
    {
      header: 'الدور الوظيفي',
      accessor: 'role',
      render: (row) => getRoleBadge(row.role)
    },
    {
      header: 'الفرع التابع له (Branch FK)',
      accessor: 'branch_name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Building2 size={14} color="var(--primary)" />
          <span>{row.branch_name}</span>
        </div>
      )
    },
    {
      header: 'رقم الهاتف',
      accessor: 'phone',
      render: (row) => (
        <span dir="ltr" style={{ fontSize: '0.85rem' }}>{row.phone}</span>
      )
    },
    {
      header: 'البريد الإلكتروني',
      accessor: 'email',
      render: (row) => <span style={{ fontSize: '0.825rem' }}>{row.email}</span>
    },
    {
      header: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(row)} title="تعديل الموظف">
            <Edit2 size={14} />
            <span>تعديل</span>
          </button>
          <button className="btn btn-danger-light btn-sm" onClick={() => setDeleteId(row.id)} title="حذف الموظف">
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
            <UserCheck size={24} color="var(--primary)" />
            <span>إدارة الموظفين وفريق العمل (Employees Management)</span>
          </h1>
          <p className="page-header-desc">
            إدارة الصيادلة، مديري الفروع، الكاشير وسائقي التوصيل مع فحص دقة الأرقام القومية والصلاحيات
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          searchPlaceholder="بحث باسم الموظف، الرقم القومي، الدور، أو الفرع..."
          emptyMessage="لا يوجد موظفون مسجلون"
        />
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد بالنظام'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : (editingEmployee ? 'حفظ التعديلات' : 'تسجيل الموظف')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                الاسم الرباعي للموظف <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="مثال: د. أحمد سامي علي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                الرقم القومي (14 رقماً - Unique) <span className="required">*</span>
              </label>
              <input
                type="text"
                maxLength={14}
                required
                className="form-control"
                placeholder="29501011234567"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value.replace(/\D/g, '') })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                الفرع التابع له (Branch FK) <span className="required">*</span>
              </label>
              <select
                required
                className="form-select"
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              >
                <option value="">-- اختر فرع العمل --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                الدور الوظيفي / الصلاحية <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Manager">مدير فرع (Branch Manager)</option>
                <option value="Pharmacist">صيدلي (Pharmacist)</option>
                <option value="Cashier">كاشير ومبيعات (Cashier)</option>
                <option value="Driver">سائق توصيل منزلي (Driver)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                رقم الهاتف الشخصي <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="01012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label className="form-label">البريد الإلكتروني للعمل</label>
              <input
                type="email"
                className="form-control"
                placeholder="emp@pharmacy.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">عنوان السكن الحالي</label>
            <input
              type="text"
              className="form-control"
              placeholder="مثال: حي السفارات، مدينة نصر، القاهرة"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الموظف"
        message="هل أنت متأكد من رغبتك في حذف هذا الموظف؟ لن يتمكن من تسجيل الدخول للنظام بعد الحذف."
        loading={actionLoading}
      />
    </div>
  );
};
