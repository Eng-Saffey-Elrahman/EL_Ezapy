const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT b.branch_id AS id, b.branch_name AS name, b.branch_status AS status, b.phone,
               b.governorate, b.city, b.street,
               (b.street + '، ' + b.city + '، ' + b.governorate) AS address,
               b.warehouse_id, w.warehouse_name,
               b.employee_id AS manager_id,
               CASE WHEN b.employee_id = 1 THEN 'د. صفي الرحمن' ELSE e.employee_name END AS manager_name,
               CONVERT(VARCHAR(10), b.manager_start_date, 120) AS start_date
        FROM BRANCH b
        LEFT JOIN CENTRAL_WAREHOUSE w ON b.warehouse_id = w.warehouse_id
        LEFT JOIN EMPLOYEE e ON b.employee_id = e.employee_id
        ORDER BY b.branch_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const branches = (store.branches || []).map(b => {
      const w = (store.warehouses || []).find(x => x.warehouse_id === b.warehouse_id);
      const e = (store.employees || []).find(x => x.employee_id === b.employee_id);
      return {
        id: b.branch_id,
        name: b.branch_name,
        status: b.branch_status,
        phone: b.phone,
        governorate: b.governorate,
        city: b.city,
        street: b.street,
        address: `${b.street}، ${b.city}، ${b.governorate}`,
        warehouse_id: b.warehouse_id,
        warehouse_name: w ? w.warehouse_name : `مستودع #${b.warehouse_id}`,
        manager_id: b.employee_id,
        manager_name: b.employee_id === 1 ? 'د. صفي الرحمن' : (e ? e.employee_name : `مدير #${b.employee_id}`),
        start_date: b.manager_start_date
      };
    });
    return res.json({ success: true, data: branches });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT b.branch_id AS id, b.branch_name AS name, b.branch_status AS status, b.phone,
                 b.governorate, b.city, b.street,
                 (b.street + '، ' + b.city + '، ' + b.governorate) AS address,
                 b.warehouse_id, w.warehouse_name,
                 b.employee_id AS manager_id,
                 CASE WHEN b.employee_id = 1 THEN 'د. صفي الرحمن' ELSE e.employee_name END AS manager_name,
                 CONVERT(VARCHAR(10), b.manager_start_date, 120) AS start_date
          FROM BRANCH b
          LEFT JOIN CENTRAL_WAREHOUSE w ON b.warehouse_id = w.warehouse_id
          LEFT JOIN EMPLOYEE e ON b.employee_id = e.employee_id
          WHERE b.branch_id = @id
        `);
      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
      }
      return res.json({ success: true, data: result.recordset[0] });
    }

    const store = getMemoryStore();
    const b = (store.branches || []).find(x => x.branch_id === id);
    if (!b) return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    const w = (store.warehouses || []).find(x => x.warehouse_id === b.warehouse_id);
    const e = (store.employees || []).find(x => x.employee_id === b.employee_id);
    return res.json({
      success: true,
      data: {
        id: b.branch_id,
        name: b.branch_name,
        status: b.branch_status,
        phone: b.phone,
        governorate: b.governorate,
        city: b.city,
        street: b.street,
        address: `${b.street}، ${b.city}، ${b.governorate}`,
        warehouse_id: b.warehouse_id,
        warehouse_name: w ? w.warehouse_name : '',
        manager_id: b.employee_id,
        manager_name: b.employee_id === 1 ? 'د. صفي الرحمن' : (e ? e.employee_name : ''),
        start_date: b.manager_start_date
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, address, warehouse_id, manager_id, start_date } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'اسم الفرع ورقم الهاتف مطلوبان' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      const nextIdRes = await pool.request().query('SELECT ISNULL(MAX(branch_id), 0) + 1 AS nextId FROM BRANCH');
      const nextId = nextIdRes.recordset[0].nextId;

      await pool.request()
        .input('id', sql.Int, nextId)
        .input('name', sql.VarChar(100), name.trim())
        .input('status', sql.VarChar(50), 'نشط')
        .input('phone', sql.VarChar(20), phone.trim())
        .input('gov', sql.VarChar(50), 'القاهرة')
        .input('city', sql.VarChar(50), 'الفرع الجديد')
        .input('street', sql.VarChar(100), address?.trim() || 'شارع رئيسي')
        .input('wh_id', sql.Int, parseInt(warehouse_id, 10) || 1)
        .input('emp_id', sql.Int, parseInt(manager_id, 10) || 1)
        .input('start_date', sql.Date, start_date || new Date())
        .query(`
          INSERT INTO BRANCH (branch_id, branch_name, branch_status, phone, governorate, city, street, warehouse_id, employee_id, manager_start_date)
          VALUES (@id, @name, @status, @phone, @gov, @city, @street, @wh_id, @emp_id, @start_date)
        `);

      return res.status(201).json({ success: true, data: { id: nextId, name, phone } });
    }

    const store = getMemoryStore();
    const nextId = (store.branches?.length ? Math.max(...store.branches.map(x => x.branch_id)) : 0) + 1;
    const newBranch = {
      branch_id: nextId,
      branch_name: name.trim(),
      branch_status: 'نشط',
      phone: phone.trim(),
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      street: address?.trim() || 'شارع رئيسي',
      warehouse_id: parseInt(warehouse_id, 10) || 1,
      employee_id: parseInt(manager_id, 10) || 1,
      manager_start_date: start_date || new Date().toISOString().split('T')[0]
    };
    store.branches = store.branches || [];
    store.branches.push(newBranch);
    return res.status(201).json({ success: true, data: { id: nextId, ...newBranch } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, phone, address, warehouse_id, manager_id, start_date } = req.body;

    if (isDbConnected()) {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .input('name', sql.VarChar(100), name?.trim())
        .input('phone', sql.VarChar(20), phone?.trim())
        .input('street', sql.VarChar(100), address?.trim())
        .input('wh_id', sql.Int, warehouse_id ? parseInt(warehouse_id, 10) : 1)
        .input('emp_id', sql.Int, manager_id ? parseInt(manager_id, 10) : 1)
        .query(`
          UPDATE BRANCH
          SET branch_name = ISNULL(@name, branch_name),
              phone = ISNULL(@phone, phone),
              street = ISNULL(@street, street),
              warehouse_id = ISNULL(@wh_id, warehouse_id),
              employee_id = ISNULL(@emp_id, employee_id)
          WHERE branch_id = @id
        `);
      return res.json({ success: true, message: 'تم تحديث بيانات الفرع بنجاح' });
    }

    const store = getMemoryStore();
    const b = (store.branches || []).find(x => x.branch_id === id);
    if (!b) return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    if (name) b.branch_name = name.trim();
    if (phone) b.phone = phone.trim();
    if (address) b.street = address.trim();
    if (warehouse_id) b.warehouse_id = parseInt(warehouse_id, 10);
    if (manager_id) b.employee_id = parseInt(manager_id, 10);
    return res.json({ success: true, message: 'تم التحديث بنجاح' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isDbConnected()) {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM BRANCH WHERE branch_id = @id');
      return res.json({ success: true, message: 'تم حذف الفرع' });
    }

    const store = getMemoryStore();
    store.branches = (store.branches || []).filter(b => b.branch_id !== id);
    return res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
