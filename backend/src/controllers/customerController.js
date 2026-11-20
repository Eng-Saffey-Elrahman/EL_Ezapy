const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT customer_id AS id, customer_name AS name, phone, loyalty_points,
               governorate, city, street,
               (street + '، ' + city + '، ' + governorate) AS address,
               ('customer' + CAST(customer_id AS VARCHAR) + '@elezaby.com') AS email,
               '2026-01-01' AS created_at
        FROM CUSTOMER
        ORDER BY customer_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const customers = (store.customers || []).map(c => ({
      id: c.customer_id,
      name: c.customer_name,
      phone: c.phone,
      loyalty_points: Number(c.loyalty_points) || 0,
      governorate: c.governorate,
      city: c.city,
      street: c.street,
      address: `${c.street}، ${c.city}، ${c.governorate}`,
      email: `customer${c.customer_id}@elezaby.com`,
      created_at: '2026-01-01'
    }));

    return res.json({ success: true, data: customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, address, loyalty_points } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'اسم العميل ورقم الهاتف مطلوبان' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      const nextIdRes = await pool.request().query('SELECT ISNULL(MAX(customer_id), 0) + 1 AS nextId FROM CUSTOMER');
      const nextId = nextIdRes.recordset[0].nextId;

      await pool.request()
        .input('id', sql.Int, nextId)
        .input('name', sql.VarChar(100), name.trim())
        .input('phone', sql.VarChar(20), phone.trim())
        .input('pts', sql.Int, parseInt(loyalty_points, 10) || 0)
        .input('gov', sql.VarChar(50), 'القاهرة')
        .input('city', sql.VarChar(50), 'مدينة نصر')
        .input('street', sql.VarChar(100), address?.trim() || 'شارع رئيسي')
        .query(`
          INSERT INTO CUSTOMER (customer_id, customer_name, phone, loyalty_points, governorate, city, street)
          VALUES (@id, @name, @phone, @pts, @gov, @city, @street)
        `);

      return res.status(201).json({ success: true, data: { id: nextId, name, phone } });
    }

    const store = getMemoryStore();
    const nextId = (store.customers?.length ? Math.max(...store.customers.map(x => x.customer_id)) : 0) + 1;
    const newCust = {
      customer_id: nextId,
      customer_name: name.trim(),
      phone: phone.trim(),
      loyalty_points: parseInt(loyalty_points, 10) || 0,
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      street: address?.trim() || 'شارع رئيسي'
    };
    store.customers = store.customers || [];
    store.customers.push(newCust);
    return res.status(201).json({ success: true, data: { id: nextId, ...newCust } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
