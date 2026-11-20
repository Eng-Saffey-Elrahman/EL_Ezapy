import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  User,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { posService, customerService } from '../services/api';
import { Modal } from '../components/Modal';

export const POS = () => {
  const { user } = useAuth();
  const { success, error, warning } = useNotify();

  // Stock list available in current branch
  const [stockList, setStockList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Invoice State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Dynamic Line Items with sequential item_id (1, 2, 3...)
  const [items, setItems] = useState([
    {
      item_id: 1,
      medicine_id: '',
      medicine_name: '',
      available_qty: 0,
      unit_price: 0,
      quantity: 1,
      discount: 0,
      line_total: 0
    }
  ]);

  // Delivery Option State
  const [isDeliveryRequired, setIsDeliveryRequired] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: '',
    driver_id: '5',
    driver_name: 'ياسر إبراهيم (سائق الفرع)',
    fee: 20.00
  });

  // Quick Customer Registration Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });

  // Receipt Modal upon successful checkout
  const [completedInvoice, setCompletedInvoice] = useState(null);

  useEffect(() => {
    loadBranchData();
  }, [user?.branch_id]);

  const loadBranchData = async () => {
    setLoading(true);
    try {
      const [stock, custs] = await Promise.all([
        posService.getBranchStockList(user?.branch_id || 1),
        customerService.getAll()
      ]);
      setStockList(stock);
      setCustomers(custs);
    } finally {
      setLoading(false);
    }
  };

  // Handle medicine selection for a line item
  const handleMedicineChange = (index, medicineId) => {
    const selectedMed = stockList.find((s) => s.medicine_id === Number(medicineId));
    const updated = [...items];

    if (!selectedMed) {
      updated[index] = {
        ...updated[index],
        medicine_id: '',
        medicine_name: '',
        available_qty: 0,
        unit_price: 0,
        line_total: 0
      };
    } else {
      const unitPrice = selectedMed.price || 0;
      const qty = updated[index].quantity || 1;
      const discount = updated[index].discount || 0;
      const lineTotal = Math.max(0, (unitPrice * qty) - discount);

      updated[index] = {
        ...updated[index],
        medicine_id: selectedMed.medicine_id,
        medicine_name: selectedMed.medicine_name,
        available_qty: selectedMed.quantity,
        unit_price: unitPrice,
        line_total: lineTotal
      };
    }

    setItems(updated);
  };

  // Handle quantity change
  const handleQuantityChange = (index, qtyValue) => {
    const qty = parseInt(qtyValue, 10) || 0;
    const updated = [...items];
    const currentItem = updated[index];

    // Real-time stock limit check
    if (currentItem.available_qty > 0 && qty > currentItem.available_qty) {
      warning(`تنبيه: الكمية المطلوبة تتجاوز المتاح في مخزون الفرع (${currentItem.available_qty} عبوة)!`);
    }

    const unitPrice = currentItem.unit_price || 0;
    const discount = currentItem.discount || 0;
    const lineTotal = Math.max(0, (unitPrice * qty) - discount);

    updated[index] = {
      ...currentItem,
      quantity: qty,
      line_total: lineTotal
    };

    setItems(updated);
  };

  // Handle discount change
  const handleDiscountChange = (index, discountValue) => {
    const discount = parseFloat(discountValue) || 0;
    const updated = [...items];
    const currentItem = updated[index];

    const unitPrice = currentItem.unit_price || 0;
    const qty = currentItem.quantity || 1;
    const lineTotal = Math.max(0, (unitPrice * qty) - discount);

    updated[index] = {
      ...currentItem,
      discount: discount,
      line_total: lineTotal
    };

    setItems(updated);
  };

  // Add new item row with sequential item_id (1, 2, 3...)
  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        item_id: items.length + 1,
        medicine_id: '',
        medicine_name: '',
        available_qty: 0,
        unit_price: 0,
        quantity: 1,
        discount: 0,
        line_total: 0
      }
    ]);
  };

  // Remove item row and re-sequence item_id
  const handleRemoveItemRow = (index) => {
    if (items.length === 1) {
      // Reset if only 1 item left
      setItems([
        {
          item_id: 1,
          medicine_id: '',
          medicine_name: '',
          available_qty: 0,
          unit_price: 0,
          quantity: 1,
          discount: 0,
          line_total: 0
        }
      ]);
      return;
    }

    const filtered = items.filter((_, i) => i !== index);
    // Re-index item_ids sequentially (1, 2, 3...)
    const reindexed = filtered.map((it, idx) => ({
      ...it,
      item_id: idx + 1
    }));
    setItems(reindexed);
  };

  // Quick Customer Creation
  const handleQuickCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      error('يرجى ملء اسم العميل ورقم الهاتف');
      return;
    }

    try {
      const created = await customerService.create(newCustomerForm);
      setCustomers([created, ...customers]);
      setSelectedCustomerId(created.id);
      setIsCustomerModalOpen(false);
      setNewCustomerForm({ name: '', phone: '', address: '' });
      success('تم تسجيل العميل وربطه بالفاتورة بنجاح');
    } catch (err) {
      error(err.message || 'فشلت إضافة العميل');
    }
  };

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const deliveryFee = isDeliveryRequired ? Number(deliveryDetails.fee || 0) : 0;
  const netTotal = Math.max(0, subtotal - totalDiscount) + deliveryFee;

  // Selected customer info
  const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));

  // Save Invoice (with ACID transaction simulation and multi-click prevention)
  const handleSaveInvoice = async () => {
    // 1. Validation
    const validItems = items.filter((it) => it.medicine_id && it.quantity > 0);
    if (validItems.length === 0) {
      error('يرجى اختيار دواء واحد على الأقل وتحديد كميته');
      return;
    }

    // Check each item against available stock
    for (const it of validItems) {
      if (it.quantity > it.available_qty) {
        error(`فشل الحفظ: كمية الدواء (${it.medicine_name}) المطلوبة (${it.quantity}) تفوق المتاح بالفرع (${it.available_qty})!`);
        return;
      }
    }

    if (isDeliveryRequired && !deliveryDetails.address && (!selectedCustomer || !selectedCustomer.address)) {
      error('يرجى إدخال عنوان التوصيل للعميل');
      return;
    }

    // 2. Prevent double submission
    setSubmitting(true);

    try {
      const payload = {
        branch_id: user?.branch_id || 1,
        employee_id: user?.id || 1,
        employee_name: user?.name || 'موظف الصيدلية',
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        items: validItems,
        subtotal: subtotal,
        discount_amount: totalDiscount,
        net_total: netTotal,
        payment_method: paymentMethod,
        delivery_required: isDeliveryRequired,
        delivery_details: isDeliveryRequired ? {
          ...deliveryDetails,
          customer_name: selectedCustomer?.name,
          customer_phone: selectedCustomer?.phone,
          address: deliveryDetails.address || selectedCustomer?.address
        } : null
      };

      const result = await posService.checkoutInvoice(payload);

      success(`تم حفظ الفاتورة بنجاح: ${result.invoice.invoice_number}`);
      setCompletedInvoice(result.invoice);

      // Reset POS Form
      setItems([
        {
          item_id: 1,
          medicine_id: '',
          medicine_name: '',
          available_qty: 0,
          unit_price: 0,
          quantity: 1,
          discount: 0,
          line_total: 0
        }
      ]);
      setSelectedCustomerId('');
      setIsDeliveryRequired(false);

      // Refresh branch stock
      loadBranchData();
    } catch (err) {
      error(err.message || 'فشلت عملية حفظ الفاتورة وإتمام المعاملة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* POS Top Header Info (Employee & Branch locked to session) */}
      <div
        className="card"
        style={{
          marginBottom: '1.25rem',
          background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)',
          borderColor: 'var(--primary-border)'
        }}
      >
        <div className="card-body" style={{ padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingCart size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  نقطة البيع السريعة والفواتير (POS)
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  نظام البيع اللحظي وإصدار الفواتير وخصم المخزون
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)' }}>الفرع الحالي:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.branch_name}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)' }}>الصيدلي المسجل:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)' }}>التاريخ:</span>
                <strong dir="ltr">{new Date().toLocaleDateString('ar-EG')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Two-Column Layout */}
      <div className="pos-layout">
        {/* Left Column: Items Grid & Customer Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Customer Selection Card */}
          <div className="card">
            <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>
                    اختيار العميل (أو البحث برقم الهاتف)
                  </label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">-- عميل نقدي (Walk-in Customer) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - هاتف: {c.phone} (نقاط الولاء: {c.loyalty_points || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsCustomerModalOpen(true)}
                    style={{ height: '38px', marginTop: 'auto' }}
                  >
                    <UserPlus size={16} color="var(--primary)" />
                    <span>عميل جديد</span>
                  </button>
                </div>
              </div>

              {selectedCustomer && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.55rem 0.85rem',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem'
                  }}
                >
                  <span style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>
                    العميل: {selectedCustomer.name} | العنوان: {selectedCustomer.address || 'غير محدد'}
                  </span>
                  <span className="badge badge-success">
                    رصيد نقاط الولاء: {selectedCustomer.loyalty_points || 0} نقطة
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={18} color="var(--primary)" />
                <span>أصناف الفاتورة (Invoice Line Items)</span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddItemRow}
              >
                <Plus size={16} />
                <span>إضافة سطر دواء جديد</span>
              </button>
            </div>

            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>#</th>
                    <th style={{ minWidth: '220px' }}>اختيار الدواء المتاح بالفرع</th>
                    <th style={{ width: '90px' }}>المتاح</th>
                    <th style={{ width: '95px' }}>سعر الوحدة</th>
                    <th style={{ width: '90px' }}>الكمية</th>
                    <th style={{ width: '85px' }}>الخصم</th>
                    <th style={{ width: '105px' }}>الإجمالي</th>
                    <th style={{ width: '50px' }}>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        {item.item_id}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.medicine_id}
                          onChange={(e) => handleMedicineChange(idx, e.target.value)}
                          style={{ fontSize: '0.825rem' }}
                        >
                          <option value="">-- اختر الدواء --</option>
                          {stockList.map((med) => (
                            <option
                              key={med.medicine_id}
                              value={med.medicine_id}
                              disabled={med.quantity <= 0}
                            >
                              {med.medicine_name} - (متاح: {med.quantity} عبوة) - {med.price} ج.م
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          className={`badge ${item.available_qty <= 5 ? 'badge-danger' : 'badge-neutral'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {item.available_qty}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {item.unit_price ? `${item.unit_price.toFixed(2)}` : '0.00'}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={item.available_qty || 999}
                          className="form-control"
                          style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className="form-control"
                          style={{ padding: '0.35rem', textAlign: 'center' }}
                          value={item.discount}
                          onChange={(e) => handleDiscountChange(idx, e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-hover)' }}>
                        {item.line_total.toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger-light btn-icon"
                          style={{ padding: '0.3rem' }}
                          onClick={() => handleRemoveItemRow(idx)}
                          title="حذف هذا السطر"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Toggle & Options */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Truck size={20} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>توصيل منزلي للمريض (Home Delivery)</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      هل يتطلب الطلب توصيل خارجي عبر سيارة الفرع؟
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${!isDeliveryRequired ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsDeliveryRequired(false)}
                  >
                    لا (استلام بالصيدلية)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isDeliveryRequired ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsDeliveryRequired(true)}
                  >
                    نعم (Delivery Required)
                  </button>
                </div>
              </div>

              {isDeliveryRequired && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                >
                  <div className="grid-3">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">
                        عنوان التوصيل بالتفصيل <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="الشارع، العمارة، الدور، رقم الشقة"
                        value={deliveryDetails.address || selectedCustomer?.address || ''}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">رسوم التوصيل (ج.م)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={deliveryDetails.fee}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fee: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">سائق التوصيل المكلف</label>
                    <select
                      className="form-select"
                      value={deliveryDetails.driver_id}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, driver_id: e.target.value })}
                    >
                      <option value="5">ياسر إبراهيم (سائق التوصيل المعتمد للفرع)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Payment Panel */}
        <div className="pos-cart-panel">
          <div className="card-header">
            <div className="card-title">
              <Banknote size={18} color="var(--primary)" />
              <span>ملخص وحسابات الفاتورة</span>
            </div>
          </div>

          <div className="card-body">
            {/* Payment Method Selector */}
            <div className="form-group">
              <label className="form-label">طريقة الدفع (Payment Method)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setPaymentMethod('Cash')}
                >
                  <Banknote size={16} />
                  <span>نقدي (Cash)</span>
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'Card' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setPaymentMethod('Card')}
                >
                  <CreditCard size={16} />
                  <span>بطاقة (Card)</span>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ margin: '1.25rem 0' }}>
              <div className="pos-summary-row">
                <span>إجمالي الأصناف قبل الخصم:</span>
                <strong>{subtotal.toFixed(2)} ج.م</strong>
              </div>

              <div className="pos-summary-row" style={{ color: 'var(--danger)' }}>
                <span>إجمالي الخصومات:</span>
                <strong>- {totalDiscount.toFixed(2)} ج.م</strong>
              </div>

              {isDeliveryRequired && (
                <div className="pos-summary-row" style={{ color: 'var(--primary-hover)' }}>
                  <span>رسوم التوصيل للمنزل:</span>
                  <strong>+ {deliveryFee.toFixed(2)} ج.م</strong>
                </div>
              )}

              <div className="pos-summary-row pos-summary-total">
                <span>الصافي المطلوب سداده:</span>
                <span>{netTotal.toFixed(2)} ج.م</span>
              </div>
            </div>

            {selectedCustomer && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                سيحصل العميل على <strong>{Math.floor(netTotal / 10)} نقطة ولاء</strong> إضافية عند إتمام الفاتورة.
              </div>
            )}

            {/* Save Button with Debounce Protection */}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '0.85rem' }}
              onClick={handleSaveInvoice}
              disabled={submitting || subtotal <= 0}
            >
              {submitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" />
                  <span>جاري تنفيذ المعاملة وخصم المخزون...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} />
                  <span>حفظ الفاتورة وإتمام البيع</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="تسجيل عميل جديد سريعاً للـ POS"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(false)}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleQuickCreateCustomer}>
              تسجيل وتحديد الفاتورة
            </button>
          </>
        }
      >
        <form onSubmit={handleQuickCreateCustomer}>
          <div className="form-group">
            <label className="form-label">
              اسم العميل <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="مثال: حسام الدين محمود"
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              رقم الهاتف <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="01012345678"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input
              type="text"
              className="form-control"
              placeholder="عنوان التوصيل والمنزل"
              value={newCustomerForm.address}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Completed Invoice Printable Receipt Modal */}
      <Modal
        isOpen={Boolean(completedInvoice)}
        onClose={() => setCompletedInvoice(null)}
        title="إيصال استلام فاتورة بيع (Receipt)"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCompletedInvoice(null)}>
              إغلاق
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} />
              <span>طباعة الإيصال الفوري</span>
            </button>
          </>
        }
      >
        {completedInvoice && (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#fafbfc',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>مجموعة صيدليات العزبي (El Ezaby Pharmacy)</div>
              <div style={{ fontSize: '0.85rem' }}>{completedInvoice.branch_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>فاتورة بيع رقم: {completedInvoice.invoice_number}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>التاريخ: {completedInvoice.created_at}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الصيدلي المسؤول: {completedInvoice.employee_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>العميل: {completedInvoice.customer_name}</div>
            </div>

            <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'right', padding: '4px' }}>الصنف</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>الكمية</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>السعر</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {completedInvoice.items.map((it) => (
                  <tr key={it.item_id}>
                    <td style={{ padding: '4px' }}>{it.medicine_name}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{it.unit_price}</td>
                    <td style={{ textAlign: 'left', padding: '4px' }}>{it.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المجموع:</span>
                <span>{completedInvoice.subtotal.toFixed(2)} ج.م</span>
              </div>
              {completedInvoice.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>الخصم:</span>
                  <span>- {completedInvoice.discount_amount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #cbd5e1' }}>
                <span>الصافي المدفوع:</span>
                <span>{completedInvoice.net_total.toFixed(2)} ج.م</span>
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                طريقة الدفع: {completedInvoice.payment_method === 'Cash' ? 'نقدي' : 'بطاقة ائتمان'}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              صيدليات العزبي تتمنى لكم دوام الصحة والعافية • الخط الساخن: 19714 • احتفظ بالإيصال للاسترجاع
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
