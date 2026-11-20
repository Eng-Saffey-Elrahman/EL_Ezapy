const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.checkout = async (req, res) => {
  const {
    branch_id,
    employee_id,
    customer_id,
    payment_method,
    net_total,
    items,
    delivery_required,
    delivery_details
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'لا يمكن إتمام فاتورة فارغة بدون أصناف' });
  }

  const bId = parseInt(branch_id, 10) || 1;
  const eId = parseInt(employee_id, 10) || 1;
  const cId = parseInt(customer_id, 10) || 1; // Fallback to customer 1 to satisfy FK NOT NULL
  const total = parseFloat(net_total) || 0;
  const method = payment_method || 'نقدي';

  if (isDbConnected()) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 1. Check stock with UPDLOCK
      for (const item of items) {
        const medId = parseInt(item.medicine_id, 10);
        const qty = parseInt(item.quantity, 10);

        const checkRes = await transaction.request()
          .input('bid', sql.Int, bId)
          .input('mid', sql.Int, medId)
          .query(`
            SELECT available_quantity
            FROM BRANCH_INVENTORY WITH (UPDLOCK)
            WHERE branch_id = @bid AND medicine_id = @mid
          `);

        if (!checkRes.recordset.length || checkRes.recordset[0].available_quantity < qty) {
          const avail = checkRes.recordset.length ? checkRes.recordset[0].available_quantity : 0;
          throw new Error(`رصيد المخزون غير كافٍ للدواء رقم ${medId}. المتاح: ${avail} عبوة، والمطلوب: ${qty}`);
        }
      }

      // 2. Deduct from BRANCH_INVENTORY
      for (const item of items) {
        const medId = parseInt(item.medicine_id, 10);
        const qty = parseInt(item.quantity, 10);

        await transaction.request()
          .input('qty', sql.Int, qty)
          .input('bid', sql.Int, bId)
          .input('mid', sql.Int, medId)
          .query(`
            UPDATE BRANCH_INVENTORY
            SET available_quantity = available_quantity - @qty
            WHERE branch_id = @bid AND medicine_id = @mid
          `);
      }

      // 3. Insert into INVOICE
      const nextInvRes = await transaction.request()
        .query('SELECT ISNULL(MAX(invoice_id), 0) + 1 AS nextId FROM INVOICE');
      const invoiceId = nextInvRes.recordset[0].nextId;

      await transaction.request()
        .input('id', sql.Int, invoiceId)
        .input('date', sql.DateTime, new Date())
        .input('total', sql.Decimal(10, 2), total)
        .input('method', sql.VarChar(50), method)
        .input('eid', sql.Int, eId)
        .input('bid', sql.Int, bId)
        .input('cid', sql.Int, cId)
        .query(`
          INSERT INTO INVOICE (invoice_id, invoice_date, total_amount, payment_method, employee_id, branch_id, customer_id)
          VALUES (@id, @date, @total, @method, @eid, @bid, @cid)
        `);

      // 4. Insert into INVOICE_DETAILS (sequential item_id 1, 2, 3...)
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        await transaction.request()
          .input('invid', sql.Int, invoiceId)
          .input('itemid', sql.Int, idx + 1)
          .input('uprice', sql.Decimal(10, 2), parseFloat(item.unit_price) || 0)
          .input('discount', sql.Decimal(10, 2), parseFloat(item.discount) || 0)
          .input('qty', sql.Int, parseInt(item.quantity, 10) || 1)
          .input('mid', sql.Int, parseInt(item.medicine_id, 10))
          .query(`
            INSERT INTO INVOICE_DETAILS (invoice_id, item_id, unit_price, discount_amount, sold_quantity, medicine_id)
            VALUES (@invid, @itemid, @uprice, @discount, @qty, @mid)
          `);
      }

      // 5. If Delivery Required
      if (delivery_required) {
        const nextDelRes = await transaction.request()
          .query('SELECT ISNULL(MAX(delivery_id), 0) + 1 AS nextId FROM DELIVERY_ORDER');
        const deliveryId = nextDelRes.recordset[0].nextId;

        await transaction.request()
          .input('did', sql.Int, deliveryId)
          .input('driver', sql.VarChar(100), delivery_details?.driver_name || 'كابتن خالد عثمان')
          .input('status', sql.VarChar(50), 'في الطريق')
          .input('dep_time', sql.DateTime, new Date())
          .input('fees', sql.Decimal(10, 2), parseFloat(delivery_details?.fee) || 15)
          .input('invid', sql.Int, invoiceId)
          .query(`
            INSERT INTO DELIVERY_ORDER (delivery_id, driver_name, delivery_status, departure_time, delivery_fees, invoice_id)
            VALUES (@did, @driver, @status, @dep_time, @fees, @invid)
          `);
      }

      // 6. Update Customer Loyalty Points
      if (cId) {
        const pointsEarned = Math.floor(total / 10);
        await transaction.request()
          .input('pts', sql.Int, pointsEarned)
          .input('cid', sql.Int, cId)
          .query('UPDATE CUSTOMER SET loyalty_points = loyalty_points + @pts WHERE customer_id = @cid');
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'تم حفظ الفاتورة بنجاح في قاعدة بيانات Microsoft SQL Server',
        invoice_id: invoiceId,
        invoice_number: `INV-${new Date().getFullYear()}-${String(invoiceId).padStart(4, '0')}`,
        total_amount: total
      });
    } catch (err) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `فشل الحفظ (Rollback): ${err.message}` });
    }
  }

  // Hybrid Mode
  const store = getMemoryStore();
  const invStore = store.branchInventory || [];
  for (const item of items) {
    const record = invStore.find(i => i.branch_id === bId && i.medicine_id === parseInt(item.medicine_id, 10));
    if (!record || record.available_quantity < parseInt(item.quantity, 10)) {
      const avail = record ? record.available_quantity : 0;
      return res.status(400).json({
        success: false,
        message: `المخزون غير كافٍ للدواء رقم ${item.medicine_id}. المتاح: ${avail}، المطلوب: ${item.quantity}`
      });
    }
  }

  // Deduct
  for (const item of items) {
    const record = invStore.find(i => i.branch_id === bId && i.medicine_id === parseInt(item.medicine_id, 10));
    if (record) record.available_quantity -= parseInt(item.quantity, 10);
  }

  const newInvoiceId = (store.invoices?.length ? Math.max(...store.invoices.map(i => i.invoice_id)) : 0) + 1;
  const invoiceRecord = {
    invoice_id: newInvoiceId,
    invoice_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    total_amount: total,
    payment_method: method,
    employee_id: eId,
    branch_id: bId,
    customer_id: cId
  };
  store.invoices = store.invoices || [];
  store.invoices.push(invoiceRecord);

  // Details
  store.invoiceDetails = store.invoiceDetails || [];
  items.forEach((it, idx) => {
    store.invoiceDetails.push({
      invoice_id: newInvoiceId,
      item_id: idx + 1,
      unit_price: parseFloat(it.unit_price) || 0,
      discount_amount: parseFloat(it.discount) || 0,
      sold_quantity: parseInt(it.quantity, 10) || 1,
      medicine_id: parseInt(it.medicine_id, 10)
    });
  });

  return res.status(201).json({
    success: true,
    message: 'تم حفظ الفاتورة بنجاح',
    invoice_id: newInvoiceId,
    invoice_number: `INV-${new Date().getFullYear()}-${String(newInvoiceId).padStart(4, '0')}`,
    total_amount: total
  });
};
