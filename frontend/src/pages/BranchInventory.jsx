import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Building2,
  AlertTriangle,
  MapPin,
  Filter,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { branchInventoryService, branchService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { useNotify } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const BranchInventory = () => {
  const { user } = useAuth();
  const { success, error } = useNotify();

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branch_id || 1);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Edit Shelf Location Modal
  const [editingItem, setEditingItem] = useState(null);
  const [newShelf, setNewShelf] = useState('');
  const [newReorder, setNewReorder] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    branchService.getAll().then((data) => {
      setBranches(data);
      if (user?.branch_id) {
        setSelectedBranchId(user.branch_id);
      }
    });
  }, [user]);

  useEffect(() => {
    loadBranchInventory();
  }, [selectedBranchId]);

  const loadBranchInventory = async () => {
    setLoading(true);
    try {
      const data = await branchInventoryService.getBranchInventory(selectedBranchId);
      setInventory(data);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNewShelf(item.shelf_location || '');
    setNewReorder(item.reorder_level || 10);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setActionLoading(true);
    try {
      await branchInventoryService.updateShelfLocation(editingItem.id, newShelf);
      await branchInventoryService.updateReorderLevel(editingItem.id, newReorder);
      success('تم تحديث موقع الرف وحد إعادة الطلب بنجاح');
      setEditingItem(null);
      loadBranchInventory();
    } catch (err) {
      error(err.message || 'فشلت عملية التعديل');
    } finally {
      setActionLoading(false);
    }
  };

  const displayedInventory = showLowStockOnly
    ? inventory.filter((i) => i.is_low_stock)
    : inventory;

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;

  const columns = [
    {
      header: 'كود الدواء',
      accessor: 'medicine_code',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.medicine_code}</span>
    },
    {
      header: 'اسم الدواء والتصنيف',
      accessor: 'medicine_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.medicine_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.category}</div>
        </div>
      )
    },
    {
      header: 'الكمية المتاحة بالفرع',
      accessor: 'quantity',
      render: (row) => {
        const isCritical = row.quantity <= row.reorder_level;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: isCritical ? 'var(--danger)' : '#065f46'
              }}
            >
              {row.quantity} عبوة
            </span>
            {isCritical && (
              <span className="badge badge-danger" title="الكمية المتاحة أقل من أو تساوي حد إعادة الطلب">
                <AlertTriangle size={12} />
                <span>نقص حاد!</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'حد إعادة الطلب (Reorder Level)',
      accessor: 'reorder_level',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
          {row.reorder_level} عبوة
        </span>
      )
    },
    {
      header: 'مكان الدواء على الرف (Shelf Location)',
      accessor: 'shelf_location',
      render: (row) => (
        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
          <MapPin size={12} color="var(--primary)" />
          <span>{row.shelf_location || 'غير محدد'}</span>
        </span>
      )
    },
    {
      header: 'سعر الوحدة',
      accessor: 'price',
      render: (row) => <span>{row.price ? `${row.price.toFixed(2)} ج.م` : '-'}</span>
    },
    {
      header: 'حالة الصلاحية',
      accessor: 'expiry_date',
      render: (row) => {
        const isExp = row.med_status === 'Expired' || new Date(row.expiry_date) < new Date();
        return (
          <span className={`badge ${isExp ? 'badge-danger' : 'badge-neutral'}`}>
            <Calendar size={12} />
            <span>{row.expiry_date}</span>
          </span>
        );
      }
    },
    {
      header: 'الإجراءات والرفوف',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenEdit(row)}
            title="تعديل موقع الرف وحد الطلب"
          >
            <Edit3 size={14} />
            <span>تحديد الرف</span>
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
            <Boxes size={24} color="var(--primary)" />
            <span>مخزون الفروع ونقاط التوريد (Branch Inventory)</span>
          </h1>
          <p className="page-header-desc">
            متابعة دقيقة للأرصدة الفعلية في كل فرع مع مراقبة مؤشر حد إعادة الطلب (Available Qty &le; Reorder Level)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/central-warehouse" className="btn btn-secondary">
            <ArrowUpRight size={18} />
            <span>طلب توريد من المخزن المركزي</span>
          </Link>
        </div>
      </div>

      {/* Branch & Low Stock Filter Banner */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
              <Building2 size={20} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                  تصفية واختيار فرع الصيدلية:
                </label>
                <select
                  className="form-select"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  style={{ fontWeight: 700 }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${showLowStockOnly ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              >
                <AlertTriangle size={16} />
                <span>
                  {showLowStockOnly ? 'عرض جميع الأصناف' : `عرض النواقص فقط (${lowStockCount})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Reorder Level Banner if Low Stock Exists */}
      {lowStockCount > 0 && !showLowStockOnly && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.9rem' }}>
                تنبيه حرج: يوجد {lowStockCount} دواء وصل أو نزل عن حد إعادة الطلب (Reorder Level) في هذا الفرع!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                الصفوف المظللة بالأحمر تتطلب تحويل فوري من المخزن المركزي لتجنب نفاذ الكمية أمام العملاء.
              </div>
            </div>
          </div>
          <button
            className="btn btn-danger-light btn-sm"
            onClick={() => setShowLowStockOnly(true)}
          >
            فلترة النواقص
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={displayedInventory.map((item) => ({
            ...item,
            rowClassName: item.is_low_stock ? 'row-danger' : ''
          }))}
          loading={loading}
          searchPlaceholder="بحث باسم الدواء، الكود، الرف، أو الفئة..."
          emptyMessage="لا يوجد مخزون مسجل لهذا الفرع"
        />
      </div>

      {/* Edit Shelf Location Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`تحديد موقع الرف: ${editingItem?.medicine_name || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditingItem(null)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSaveLocation} disabled={actionLoading}>
              {actionLoading ? 'جاري الحفظ...' : 'حفظ موقع الرف والحد'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveLocation}>
          <div className="form-group">
            <label className="form-label">مكان الدواء على الرف (Shelf Location)</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="مثال: A1-04 أو خزانة الأدوية الحساسة"
              value={newShelf}
              onChange={(e) => setNewShelf(e.target.value)}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              يساعد الصيادلة في سرعة العثور على الدواء داخل الفرع أثناء إجراء عمليات البيع في الـ POS.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">حد إعادة الطلب لهذا الفرع (Reorder Level)</label>
            <input
              type="number"
              min="1"
              required
              className="form-control"
              value={newReorder}
              onChange={(e) => setNewReorder(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
