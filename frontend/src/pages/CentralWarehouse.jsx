import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { warehouseService, medicineService, branchService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { useNotify } from '../context/NotificationContext';

export const CentralWarehouse = () => {
  const { success, error } = useNotify();

  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [receiveForm, setReceiveForm] = useState({
    medicine_id: '',
    quantity: '',
    batch_no: ''
  });

  const [transferForm, setTransferForm] = useState({
    branch_id: '',
    medicine_id: '',
    quantity: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wh, inv, meds, brs] = await Promise.all([
        warehouseService.getCentralWarehouse(),
        warehouseService.getCentralInventory(),
        medicineService.getAll(),
        branchService.getAll()
      ]);
      setWarehouseInfo(wh);
      setInventory(inv);
      setMedicines(meds);
      setBranches(brs);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveShipment = async (e) => {
    e.preventDefault();
    if (!receiveForm.medicine_id || !receiveForm.quantity) {
      error('يرجى تحديد الدواء والكمية الموردة');
      return;
    }

    setActionLoading(true);
    try {
      await warehouseService.receiveShipment(receiveForm);
      success('تم استلام الشحنة وإضافتها للمخزن المركزي بنجاح');
      setIsReceiveModalOpen(false);
      setReceiveForm({ medicine_id: '', quantity: '', batch_no: '' });
      loadData();
    } catch (err) {
      error(err.message || 'فشلت عملية استلام الشحنة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferToBranch = async (e) => {
    e.preventDefault();
    if (!transferForm.branch_id || !transferForm.medicine_id || !transferForm.quantity) {
      error('يرجى اختيار الفرع والدواء وتحديد الكمية');
      return;
    }

    setActionLoading(true);
    try {
      await warehouseService.transferToBranch(transferForm);
      success('تم صرف وتحويل الكمية إلى مخزون الفرع بنجاح');
      setIsTransferModalOpen(false);
      setTransferForm({ branch_id: '', medicine_id: '', quantity: '' });
      loadData();
    } catch (err) {
      error(err.message || 'فشلت عملية التحويل');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'كود الدواء',
      accessor: 'medicine_code',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.medicine_code}</span>
    },
    {
      header: 'اسم الدواء',
      accessor: 'medicine_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.medicine_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.category}</div>
        </div>
      )
    },
    {
      header: 'رقم التشغيلة (Batch No)',
      accessor: 'batch_no',
      render: (row) => <span className="badge badge-neutral">{row.batch_no}</span>
    },
    {
      header: 'المورد الرئيسي',
      accessor: 'supplier_name',
      render: (row) => <span>{row.supplier_name || 'غير محدد'}</span>
    },
    {
      header: 'الكمية بالمخزن المركزي',
      accessor: 'quantity',
      render: (row) => (
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#065f46' }}>
          {row.quantity.toLocaleString()} عبوة
        </span>
      )
    },
    {
      header: 'سعر الوحدة',
      accessor: 'price',
      render: (row) => <span>{row.price ? `${row.price.toFixed(2)} ج.م` : '-'}</span>
    },
    {
      header: 'تاريخ الصلاحية',
      accessor: 'expiry_date',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span>{row.expiry_date}</span>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <Warehouse size={24} color="var(--primary)" />
            <span>المخزن المركزي الرئيسي (Central Warehouse)</span>
          </h1>
          <p className="page-header-desc">
            مستودع التوريد الرئيسي لتغذية الفروع واستلام الشحنات الدوائية من المصانع والموردين
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowUpRight size={18} color="var(--primary)" />
            <span>تحويل أدوية لفرع (Transfer)</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsReceiveModalOpen(true)}>
            <ArrowDownLeft size={18} />
            <span>استلام توريدة جديدة (Receive)</span>
          </button>
        </div>
      </div>

      {/* Warehouse Info Card */}
      {warehouseInfo && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>بيانات المخزن المركزي</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-hover)', marginTop: '0.2rem' }}>
                  {warehouseInfo.name} ({warehouseInfo.code})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  الموقع: {warehouseInfo.address} | الهاتف: {warehouseInfo.phone}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>المسؤول الإداري</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{warehouseInfo.manager}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>السعة التخزينية</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{warehouseInfo.capacity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>أصناف الأدوية المسجلة</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{inventory.length} صنف</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Central Inventory Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Boxes size={20} color="var(--primary)" />
            <span>رصيد الأدوية بالمخزن المركزي</span>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={inventory}
          loading={loading}
          searchPlaceholder="بحث باسم الدواء، الكود، أو المورد..."
          emptyMessage="لا توجد أدوية بالمخزن المركزي حالياً"
        />
      </div>

      {/* Receive Shipment Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="استلام شحنة جديدة من مورد (Goods Receipt)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsReceiveModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleReceiveShipment} disabled={actionLoading}>
              {actionLoading ? 'جاري الاستلام...' : 'تسجيل التوريد وتحديث المخزن'}
            </button>
          </>
        }
      >
        <form onSubmit={handleReceiveShipment}>
          <div className="form-group">
            <label className="form-label">
              اختر الدواء المورّد <span className="required">*</span>
            </label>
            <select
              required
              className="form-select"
              value={receiveForm.medicine_id}
              onChange={(e) => setReceiveForm({ ...receiveForm, medicine_id: e.target.value })}
            >
              <option value="">-- اضغط لاختيار الدواء من القائمة --</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code}) - مورد: {m.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                الكمية المستلمة (بالعبوة) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-control"
                placeholder="مثال: 500"
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">رقم التشغيلة (Batch Number)</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثال: BATCH-2026-09"
                value={receiveForm.batch_no}
                onChange={(e) => setReceiveForm({ ...receiveForm, batch_no: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Transfer to Branch Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="صرف وتحويل أدوية لفرع صيدلية (Stock Transfer)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)} disabled={actionLoading}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleTransferToBranch} disabled={actionLoading}>
              {actionLoading ? 'جاري التحويل...' : 'تأكيد التحويل لمخزون الفرع'}
            </button>
          </>
        }
      >
        <form onSubmit={handleTransferToBranch}>
          <div className="form-group">
            <label className="form-label">
              الفرع المستلم <span className="required">*</span>
            </label>
            <select
              required
              className="form-select"
              value={transferForm.branch_id}
              onChange={(e) => setTransferForm({ ...transferForm, branch_id: e.target.value })}
            >
              <option value="">-- اختر فرع الصيدلية --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.address})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                الدواء المطلوب تحويله <span className="required">*</span>
              </label>
              <select
                required
                className="form-select"
                value={transferForm.medicine_id}
                onChange={(e) => setTransferForm({ ...transferForm, medicine_id: e.target.value })}
              >
                <option value="">-- اختر الدواء من المخزن --</option>
                {inventory.map((item) => (
                  <option key={item.medicine_id} value={item.medicine_id}>
                    {item.medicine_name} (المتاح: {item.quantity} عبوة)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                الكمية المراد تحويلها <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-control"
                placeholder="مثال: 50"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--info-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--info)' }}>
            <AlertCircle size={18} />
            <small style={{ fontSize: '0.8rem' }}>
              سيتم خصم الكمية تلقائياً من المخزن المركزي وإضافتها مباشرة إلى رصيد الفرع المحدد.
            </small>
          </div>
        </form>
      </Modal>
    </div>
  );
};
