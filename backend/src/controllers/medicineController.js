const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT m.medicine_id AS id,
               ('MED-' + CAST(1000 + m.medicine_id AS VARCHAR)) AS code,
               m.medicine_name AS name,
               m.medicine_type AS category,
               CASE
                 WHEN m.medicine_name LIKE '%Amp%' THEN 'حقن'
                 WHEN m.medicine_name LIKE '%Gel%' THEN 'جل موضعي'
                 WHEN m.medicine_name LIKE '%Syrup%' THEN 'شراب'
                 WHEN m.medicine_name LIKE '%Inhaler%' THEN 'بخاخ استنشاق'
                 WHEN m.medicine_name LIKE '%Drops%' THEN 'قطرة'
                 WHEN m.medicine_name LIKE '%Caps%' THEN 'كبسولات'
                 ELSE 'أقراص'
               END AS dosage_form,
               m.price,
               ROUND(m.price * 0.75, 2) AS cost_price,
               CONVERT(VARCHAR(10), m.expiry_date, 120) AS expiry_date,
               m.supplier_id,
               s.company_name AS supplier_name,
               m.warehouse_id,
               w.warehouse_name,
               'Active' AS status,
               ('62210000' + RIGHT('000' + CAST(m.medicine_id AS VARCHAR), 4)) AS barcode
        FROM MEDICINE m
        LEFT JOIN SUPPLIER s ON m.supplier_id = s.supplier_id
        LEFT JOIN CENTRAL_WAREHOUSE w ON m.warehouse_id = w.warehouse_id
        ORDER BY m.medicine_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const medicines = (store.medicines || []).map(m => {
      const s = (store.suppliers || []).find(x => x.supplier_id === m.supplier_id);
      const w = (store.warehouses || []).find(x => x.warehouse_id === m.warehouse_id);
      const price = Number(m.price);
      return {
        id: m.medicine_id,
        code: `MED-${1000 + m.medicine_id}`,
        name: m.medicine_name,
        category: m.medicine_type,
        dosage_form: m.medicine_name.includes('Amp') ? 'حقن' :
                     m.medicine_name.includes('Gel') ? 'جل موضعي' :
                     m.medicine_name.includes('Syrup') ? 'شراب' :
                     m.medicine_name.includes('Inhaler') ? 'بخاخ استنشاق' :
                     m.medicine_name.includes('Drops') ? 'قطرة' :
                     m.medicine_name.includes('Caps') ? 'كبسولات' : 'أقراص',
        price: price,
        cost_price: Math.round(price * 0.75 * 100) / 100,
        expiry_date: m.expiry_date,
        supplier_id: m.supplier_id,
        supplier_name: s ? s.company_name : `مورد #${m.supplier_id}`,
        warehouse_id: m.warehouse_id,
        warehouse_name: w ? w.warehouse_name : `مستودع #${m.warehouse_id}`,
        status: 'Active',
        barcode: `62210000${String(m.medicine_id).padStart(4, '0')}`
      };
    });

    return res.json({ success: true, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category, price, supplier_id, expiry_date, warehouse_id } = req.body;
    if (!name || !price || !supplier_id) {
      return res.status(400).json({ success: false, message: 'اسم الدواء والسعر والمورد مطلوبان' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      const nextIdRes = await pool.request().query('SELECT ISNULL(MAX(medicine_id), 0) + 1 AS nextId FROM MEDICINE');
      const nextId = nextIdRes.recordset[0].nextId;

      await pool.request()
        .input('id', sql.Int, nextId)
        .input('name', sql.VarChar(100), name.trim())
        .input('type', sql.VarChar(50), category?.trim() || 'General')
        .input('exp', sql.Date, expiry_date || '2028-12-01')
        .input('price', sql.Decimal(10, 2), parseFloat(price))
        .input('sup_id', sql.Int, parseInt(supplier_id, 10))
        .input('wh_id', sql.Int, parseInt(warehouse_id, 10) || 1)
        .query(`
          INSERT INTO MEDICINE (medicine_id, medicine_name, medicine_type, expiry_date, price, supplier_id, warehouse_id)
          VALUES (@id, @name, @type, @exp, @price, @sup_id, @wh_id)
        `);

      return res.status(201).json({ success: true, data: { id: nextId, name, price } });
    }

    const store = getMemoryStore();
    const nextId = (store.medicines?.length ? Math.max(...store.medicines.map(x => x.medicine_id)) : 0) + 1;
    const newMed = {
      medicine_id: nextId,
      medicine_name: name.trim(),
      medicine_type: category?.trim() || 'General',
      expiry_date: expiry_date || '2028-12-01',
      price: parseFloat(price),
      supplier_id: parseInt(supplier_id, 10),
      warehouse_id: parseInt(warehouse_id, 10) || 1
    };
    store.medicines = store.medicines || [];
    store.medicines.push(newMed);
    return res.status(201).json({ success: true, data: { id: nextId, ...newMed } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isDbConnected()) {
      const pool = getPool();
      await pool.request().input('id', sql.Int, id).query('DELETE FROM MEDICINE WHERE medicine_id = @id');
      return res.json({ success: true, message: 'تم حذف الدواء بنجاح' });
    }

    const store = getMemoryStore();
    store.medicines = (store.medicines || []).filter(m => m.medicine_id !== id);
    return res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
