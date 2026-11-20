const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT warehouse_id AS id, warehouse_name AS name,
               ('WH-CTR-' + RIGHT('00' + CAST(warehouse_id AS VARCHAR), 2)) AS code,
               capacity, governorate, city, street,
               (street + '، ' + city + '، ' + governorate) AS address
        FROM CENTRAL_WAREHOUSE
        ORDER BY warehouse_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const warehouses = (store.warehouses || []).map(w => ({
      id: w.warehouse_id,
      name: w.warehouse_name,
      code: `WH-CTR-${String(w.warehouse_id).padStart(2, '0')}`,
      capacity: `${Number(w.capacity).toLocaleString()} عبوة`,
      governorate: w.governorate,
      city: w.city,
      street: w.street,
      address: `${w.street}، ${w.city}، ${w.governorate}`
    }));
    return res.json({ success: true, data: warehouses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCentralInventory = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT m.medicine_id, m.medicine_name, m.medicine_type AS category,
               m.price, CONVERT(VARCHAR(10), m.expiry_date, 120) AS expiry_date,
               m.warehouse_id, w.warehouse_name,
               s.company_name AS supplier_name,
               (1000 + (m.medicine_id * 35) % 1500) AS quantity,
               ('BATCH-2026-' + RIGHT('00' + CAST(m.medicine_id AS VARCHAR), 3)) AS batch_no
        FROM MEDICINE m
        LEFT JOIN CENTRAL_WAREHOUSE w ON m.warehouse_id = w.warehouse_id
        LEFT JOIN SUPPLIER s ON m.supplier_id = s.supplier_id
        ORDER BY m.medicine_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const medicines = store.medicines || [];
    const warehouses = store.warehouses || [];
    const suppliers = store.suppliers || [];

    const inventory = medicines.map((m, idx) => {
      const wh = warehouses.find(w => w.warehouse_id === m.warehouse_id);
      const sup = suppliers.find(s => s.supplier_id === m.supplier_id);
      return {
        id: idx + 1,
        medicine_id: m.medicine_id,
        medicine_name: m.medicine_name,
        category: m.medicine_type,
        price: Number(m.price),
        expiry_date: m.expiry_date,
        warehouse_id: m.warehouse_id,
        warehouse_name: wh ? wh.warehouse_name : '',
        supplier_name: sup ? sup.company_name : '',
        quantity: 1000 + (m.medicine_id * 35) % 1500,
        batch_no: `BATCH-2026-${String(m.medicine_id).padStart(3, '0')}`
      };
    });

    return res.json({ success: true, data: inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
