const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT e.employee_id AS id,
               CASE WHEN e.employee_id = 1 THEN 'د. صفي الرحمن' ELSE e.employee_name END AS name,
               e.national_id,
               CONVERT(VARCHAR(10), e.hire_date, 120) AS hire_date,
               e.phone, e.job_title, e.salary, e.branch_id,
               b.branch_name,
               CASE
                 WHEN e.job_title LIKE '%مدير%' THEN 'Manager'
                 WHEN e.job_title LIKE '%صيدلي%' THEN 'Pharmacist'
                 WHEN e.job_title LIKE '%دليفري%' THEN 'Driver'
                 ELSE 'Cashier'
               END AS role,
               e.job_title AS role_ar,
               CASE WHEN e.employee_id = 1 THEN 'safy.alrahman@elezaby.com' ELSE 'emp' + CAST(e.employee_id AS VARCHAR) + '@elezaby.com' END AS email,
               CASE WHEN e.employee_id = 1 THEN 'safy.alrahman' ELSE 'emp' + CAST(e.employee_id AS VARCHAR) END AS username
        FROM EMPLOYEE e
        LEFT JOIN BRANCH b ON e.branch_id = b.branch_id
        ORDER BY e.employee_id ASC
      `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const employees = (store.employees || []).map(e => {
      const b = (store.branches || []).find(x => x.branch_id === e.branch_id);
      let role = 'Cashier';
      if (e.job_title.includes('مدير')) role = 'Manager';
      else if (e.job_title.includes('صيدلي')) role = 'Pharmacist';
      else if (e.job_title.includes('دليفري')) role = 'Driver';

      return {
        id: e.employee_id,
        name: e.employee_id === 1 ? 'د. صفي الرحمن' : e.employee_name,
        national_id: String(e.national_id),
        hire_date: e.hire_date,
        phone: e.phone,
        job_title: e.job_title,
        salary: Number(e.salary),
        role: role,
        role_ar: e.job_title,
        branch_id: e.branch_id,
        branch_name: b ? b.branch_name : `فرع #${e.branch_id}`,
        email: e.employee_id === 1 ? 'safy.alrahman@elezaby.com' : `emp${e.employee_id}@elezaby.com`,
        username: e.employee_id === 1 ? 'safy.alrahman' : `emp${e.employee_id}`
      };
    });

    return res.json({ success: true, data: employees });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, national_id, phone, job_title, salary, branch_id } = req.body;
    if (!name || !national_id || national_id.length !== 14) {
      return res.status(400).json({ success: false, message: 'اسم الموظف والرقم القومي (14 رقماً) مطلوبان' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      // Check national id uniqueness
      const checkRes = await pool.request()
        .input('nid', sql.VarChar(14), national_id.trim())
        .query('SELECT employee_id FROM EMPLOYEE WHERE national_id = @nid');

      if (checkRes.recordset.length) {
        return res.status(400).json({ success: false, message: 'الرقم القومي مسجل لموظف آخر بالفعل' });
      }

      const nextIdRes = await pool.request().query('SELECT ISNULL(MAX(employee_id), 0) + 1 AS nextId FROM EMPLOYEE');
      const nextId = nextIdRes.recordset[0].nextId;

      await pool.request()
        .input('id', sql.Int, nextId)
        .input('name', sql.VarChar(100), name.trim())
        .input('nid', sql.VarChar(14), national_id.trim())
        .input('hdate', sql.Date, new Date())
        .input('phone', sql.VarChar(20), phone?.trim() || '01000000000')
        .input('job', sql.VarChar(50), job_title?.trim() || 'صيدلي')
        .input('salary', sql.Decimal(10, 2), parseFloat(salary) || 8000)
        .input('bid', sql.Int, parseInt(branch_id, 10) || 1)
        .query(`
          INSERT INTO EMPLOYEE (employee_id, employee_name, national_id, hire_date, phone, job_title, salary, branch_id)
          VALUES (@id, @name, @nid, @hdate, @phone, @job, @salary, @bid)
        `);

      return res.status(201).json({ success: true, data: { id: nextId, name, national_id } });
    }

    const store = getMemoryStore();
    const exists = (store.employees || []).some(e => String(e.national_id) === national_id.trim());
    if (exists) {
      return res.status(400).json({ success: false, message: 'الرقم القومي مسجل لموظف آخر بالفعل' });
    }

    const nextId = (store.employees?.length ? Math.max(...store.employees.map(x => x.employee_id)) : 0) + 1;
    const newEmp = {
      employee_id: nextId,
      employee_name: name.trim(),
      national_id: national_id.trim(),
      hire_date: new Date().toISOString().split('T')[0],
      phone: phone?.trim() || '01000000000',
      job_title: job_title?.trim() || 'صيدلي',
      salary: parseFloat(salary) || 8000,
      branch_id: parseInt(branch_id, 10) || 1
    };
    store.employees = store.employees || [];
    store.employees.push(newEmp);
    return res.status(201).json({ success: true, data: { id: nextId, ...newEmp } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isDbConnected()) {
      const pool = getPool();
      await pool.request().input('id', sql.Int, id).query('DELETE FROM EMPLOYEE WHERE employee_id = @id');
      return res.json({ success: true, message: 'تم حذف الموظف بنجاح' });
    }

    const store = getMemoryStore();
    store.employees = (store.employees || []).filter(e => e.employee_id !== id);
    return res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
