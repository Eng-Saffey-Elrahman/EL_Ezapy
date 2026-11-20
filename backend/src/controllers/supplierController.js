const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const supResult = await pool.request().query(`
        SELECT s.supplier_id AS id, s.company_name AS name, s.email,
               s.governorate, s.city, s.street,
               (s.street + '، ' + s.city + '، ' + s.governorate) AS address,
               s.warehouse_id
        FROM SUPPLIER s
        ORDER BY s.supplier_id ASC
      `);

      const phoneResult = await pool.request().query('SELECT supplier_id, phone FROM SUPPLIER_PHONE');
      const phoneMap = {};
      phoneResult.recordset.forEach(p => {
        if (!phoneMap[p.supplier_id]) phoneMap[p.supplier_id] = [];
        phoneMap[p.supplier_id].push(p.phone);
      });

      const suppliers = supResult.recordset.map(s => ({
        ...s,
        phones: phoneMap[s.id] || []
      }));

      return res.json({ success: true, data: suppliers });
    }

    const store = getMemoryStore();
    const phoneMap = {};
    (store.supplierPhones || []).forEach(p => {
      if (!phoneMap[p.supplier_id]) phoneMap[p.supplier_id] = [];
      phoneMap[p.supplier_id].push(p.phone);
    });

    const suppliers = (store.suppliers || []).map(s => ({
      id: s.supplier_id,
      name: s.company_name,
      email: s.email,
      governorate: s.governorate,
      city: s.city,
      street: s.street,
      address: `${s.street}، ${s.city}، ${s.governorate}`,
      warehouse_id: s.warehouse_id,
      phones: phoneMap[s.supplier_id] || []
    }));

    return res.json({ success: true, data: suppliers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, address, phones, warehouse_id } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'اسم الشركة والبريد الإلكتروني مطلوبان' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      const nextIdRes = await pool.request().query('SELECT ISNULL(MAX(supplier_id), 0) + 1 AS nextId FROM SUPPLIER');
      const nextId = nextIdRes.recordset[0].nextId;

      await pool.request()
        .input('id', sql.Int, nextId)
        .input('email', sql.VarChar(100), email.trim())
        .input('name', sql.VarChar(100), name.trim())
        .input('gov', sql.VarChar(50), 'القاهرة')
        .input('city', sql.VarChar(50), 'المنطقة الصناعية')
        .input('street', sql.VarChar(100), address?.trim() || 'شارع رئيسي')
        .input('wh_id', sql.Int, parseInt(warehouse_id, 10) || 1)
        .query(`
          INSERT INTO SUPPLIER (supplier_id, email, company_name, governorate, city, street, warehouse_id)
          VALUES (@id, @email, @name, @gov, @city, @street, @wh_id)
        `);

      if (Array.isArray(phones)) {
        for (const phone of phones) {
          if (phone && phone.trim()) {
            await pool.request()
              .input('sid', sql.Int, nextId)
              .input('ph', sql.VarChar(20), phone.trim())
              .query('INSERT INTO SUPPLIER_PHONE (supplier_id, phone) VALUES (@sid, @ph)');
          }
        }
      }

      return res.status(201).json({ success: true, data: { id: nextId, name, email } });
    }

    const store = getMemoryStore();
    const nextId = (store.suppliers?.length ? Math.max(...store.suppliers.map(x => x.supplier_id)) : 0) + 1;
    const newSupplier = {
      supplier_id: nextId,
      company_name: name.trim(),
      email: email.trim(),
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      street: address?.trim() || 'شارع رئيسي',
      warehouse_id: parseInt(warehouse_id, 10) || 1
    };
    store.suppliers = store.suppliers || [];
    store.suppliers.push(newSupplier);

    store.supplierPhones = store.supplierPhones || [];
    if (Array.isArray(phones)) {
      phones.forEach(p => {
        if (p && p.trim()) {
          store.supplierPhones.push({ supplier_id: nextId, phone: p.trim() });
        }
      });
    }

    return res.status(201).json({ success: true, data: { id: nextId, ...newSupplier } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isDbConnected()) {
      const pool = getPool();
      await pool.request().input('id', sql.Int, id).query('DELETE FROM SUPPLIER_PHONE WHERE supplier_id = @id');
      await pool.request().input('id', sql.Int, id).query('DELETE FROM SUPPLIER WHERE supplier_id = @id');
      return res.json({ success: true, message: 'تم حذف المورد بنجاح' });
    }

    const store = getMemoryStore();
    store.suppliers = (store.suppliers || []).filter(s => s.supplier_id !== id);
    store.supplierPhones = (store.supplierPhones || []).filter(p => p.supplier_id !== id);
    return res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
