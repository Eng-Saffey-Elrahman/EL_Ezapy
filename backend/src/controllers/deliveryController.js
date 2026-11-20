const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT d.delivery_id AS id,
               ('DEL-2026-' + RIGHT('00' + CAST(d.delivery_id AS VARCHAR), 3)) AS delivery_number,
               d.invoice_id,
               ('INV-2026-' + RIGHT('000' + CAST(d.invoice_id AS VARCHAR), 4)) AS invoice_number,
               c.customer_name, c.phone AS customer_phone,
               (c.street + '، ' + c.city) AS delivery_address,
               d.driver_name,
               d.delivery_fees AS delivery_fee,
               CASE
                 WHEN d.delivery_status = 'تم التوصيل' THEN 'Delivered'
                 WHEN d.delivery_status = 'في الطريق' THEN 'Out for Delivery'
                 ELSE 'Pending'
               END AS status,
               d.delivery_status AS status_ar,
               CONVERT(VARCHAR(19), d.departure_time, 120) AS dispatched_at,
               d.customer_signature
        FROM DELIVERY_ORDER d
        LEFT JOIN INVOICE i ON d.invoice_id = i.invoice_id
        LEFT JOIN CUSTOMER c ON i.customer_id = c.customer_id
        ORDER BY d.delivery_id DESC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const deliveries = (store.deliveries || []).map(del => {
      const inv = (store.invoices || []).find(i => i.invoice_id === del.invoice_id);
      const cust = inv ? (store.customers || []).find(c => c.customer_id === inv.customer_id) : null;
      let status = 'Delivered';
      if (del.delivery_status === 'في الطريق') status = 'Out for Delivery';
      else if (del.delivery_status === 'في الانتظار') status = 'Pending';

      return {
        id: del.delivery_id,
        delivery_number: `DEL-2026-${String(del.delivery_id).padStart(3, '0')}`,
        invoice_id: del.invoice_id,
        invoice_number: `INV-2026-${String(del.invoice_id).padStart(4, '0')}`,
        customer_name: cust ? cust.customer_name : 'عميل العزبي',
        customer_phone: cust ? cust.phone : '01000000000',
        delivery_address: cust ? `${cust.street}، ${cust.city}` : 'العنوان',
        driver_name: del.driver_name,
        delivery_fee: Number(del.delivery_fees || 0),
        status,
        status_ar: del.delivery_status,
        dispatched_at: del.departure_time,
        customer_signature: del.customer_signature
      };
    });

    return res.json({ success: true, data: deliveries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body; // 'Delivered' or 'Out for Delivery' or 'تم التوصيل'

    const arStatus = status === 'Delivered' ? 'تم التوصيل' :
                     status === 'Out for Delivery' ? 'في الطريق' : status;

    if (isDbConnected()) {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .input('st', sql.VarChar(50), arStatus)
        .query('UPDATE DELIVERY_ORDER SET delivery_status = @st WHERE delivery_id = @id');
      return res.json({ success: true, message: 'تم تحديث حالة التوصيل بنجاح' });
    }

    const store = getMemoryStore();
    const del = (store.deliveries || []).find(d => d.delivery_id === id);
    if (!del) return res.status(404).json({ success: false, message: 'طلب التوصيل غير موجود' });
    del.delivery_status = arStatus;
    return res.json({ success: true, message: 'تم التحديث بنجاح' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
