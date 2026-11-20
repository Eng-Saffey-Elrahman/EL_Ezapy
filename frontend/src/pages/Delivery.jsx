import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, Phone, User, Receipt, Filter, Play, Check } from 'lucide-react';
import { deliveryService } from '../services/api';
import { DataTable } from '../components/DataTable';
import { useNotify } from '../context/NotificationContext';

export const Delivery = () => {
  const { success, error } = useNotify();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getAll();
      setDeliveries(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await deliveryService.updateStatus(id, newStatus);
      success(`تم تحديث حالة طلب التوصيل إلى: ${newStatus === 'Out for Delivery' ? 'خرج للتوصيل' : 'تم التسليم بنجاح'}`);
      loadDeliveries();
    } catch (err) {
      error(err.message || 'فشل تحديث حالة الطلب');
    }
  };

  const filteredDeliveries = statusFilter === 'ALL'
    ? deliveries
    : deliveries.filter((d) => d.status === statusFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge badge-warning">
            <Clock size={12} />
            <span>قيد الانتظار (Pending)</span>
          </span>
        );
      case 'Out for Delivery':
        return (
          <span className="badge badge-info">
            <Truck size={12} />
            <span>في الطريق للعميل (Out for Delivery)</span>
          </span>
        );
      case 'Delivered':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} />
            <span>تم التسليم (Delivered)</span>
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const columns = [
    {
      header: 'رقم الطلب والفاتورة',
      accessor: 'delivery_number',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{row.delivery_number}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>فاتورة: {row.invoice_number}</div>
        </div>
      )
    },
    {
      header: 'العميل وهاتف التواصل',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.customer_name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Phone size={12} />
            <span dir="ltr">{row.customer_phone || '-'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'عنوان التوصيل للمنزل',
      accessor: 'delivery_address',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
          <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span>{row.delivery_address}</span>
        </div>
      )
    },
    {
      header: 'السائق المكلف',
      accessor: 'driver_name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
          <User size={14} color="var(--text-muted)" />
          <span>{row.driver_name}</span>
        </div>
      )
    },
    {
      header: 'رسوم التوصيل',
      accessor: 'delivery_fee',
      render: (row) => (
        <span style={{ fontWeight: 700 }}>
          {Number(row.delivery_fee).toFixed(2)} ج.م
        </span>
      )
    },
    {
      header: 'وقت الخروج والتسليم',
      render: (row) => (
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <div>الخروج: {row.dispatched_at || '-'}</div>
          <div>التسليم: {row.delivered_at || '-'}</div>
        </div>
      )
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'تحديث المسار',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          {row.status === 'Pending' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleUpdateStatus(row.id, 'Out for Delivery')}
              title="خروج السائق للتوصيل"
            >
              <Play size={14} color="var(--primary)" />
              <span>بدء التوصيل</span>
            </button>
          )}

          {row.status === 'Out for Delivery' && (
            <button
              className="btn btn-success-light btn-sm"
              onClick={() => handleUpdateStatus(row.id, 'Delivered')}
              title="تأكيد تسليم الطلب للعميل"
            >
              <Check size={14} />
              <span>تأكيد الاستلام</span>
            </button>
          )}

          {row.status === 'Delivered' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>
              مكتمل ومغلق
            </span>
          )}
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
            <span>إدارة طلبات التوصيل للمنازل (Home Delivery Orders)</span>
          </h1>
          <p className="page-header-desc">
            متابعة خطوط سير السائقين وحالات خروج وتسليم طلبيات المرضى للمنازل
          </p>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="card"
          onClick={() => setStatusFilter('ALL')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            textAlign: 'right',
            border: statusFilter === 'ALL' ? '2px solid var(--primary)' : '1px solid var(--border)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>جميع الطلبات</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {deliveries.length} طلب
          </div>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => setStatusFilter('Pending')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            textAlign: 'right',
            border: statusFilter === 'Pending' ? '2px solid var(--warning)' : '1px solid var(--border)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>قيد التجهيز والانتظار</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>
            {deliveries.filter((d) => d.status === 'Pending').length} طلب
          </div>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => setStatusFilter('Out for Delivery')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            textAlign: 'right',
            border: statusFilter === 'Out for Delivery' ? '2px solid var(--info)' : '1px solid var(--border)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--info)' }}>في الطريق مع السائق</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--info)' }}>
            {deliveries.filter((d) => d.status === 'Out for Delivery').length} طلب
          </div>
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filteredDeliveries}
          loading={loading}
          searchPlaceholder="بحث برقم الطلب، الفاتورة، العميل، أو السائق..."
          emptyMessage="لا توجد طلبات توصيل مسجلة حالياً"
        />
      </div>
    </div>
  );
};
