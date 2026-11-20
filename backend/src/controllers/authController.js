const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم أو الرقم القومي مطلوب' });
    }

    const cleanUser = username.trim().toLowerCase();

    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request()
        .input('query', sql.VarChar(100), cleanUser)
        .query(`
          SELECT e.employee_id, e.employee_name, e.national_id, e.phone, e.job_title, e.salary, e.branch_id,
                 b.branch_name, b.governorate, b.city
          FROM EMPLOYEE e
          LEFT JOIN BRANCH b ON e.branch_id = b.branch_id
          WHERE LOWER(e.employee_name) LIKE '%' + @query + '%'
             OR e.national_id = @query
             OR CAST(e.employee_id AS VARCHAR) = @query
             OR (@query = 'safy.alrahman' AND e.employee_id = 1)
        `);

      if (!result.recordset.length) {
        return res.status(401).json({ success: false, message: 'الموظف غير موجود بالنظام، يرجى مراجعة البيانات' });
      }

      const emp = result.recordset[0];
      const role = emp.job_title?.includes('مدير') ? 'Manager' :
                   emp.job_title?.includes('صيدلي') ? 'Pharmacist' :
                   emp.job_title?.includes('دليفري') ? 'Driver' : 'Cashier';

      return res.json({
        success: true,
        user: {
          id: emp.employee_id,
          name: emp.employee_id === 1 ? 'د. صفي الرحمن' : emp.employee_name,
          national_id: emp.national_id,
          role,
          role_ar: emp.job_title,
          branch_id: emp.branch_id,
          branch_name: emp.branch_name || 'فرع العزبي - مدينة نصر الرئيسي',
          email: emp.employee_id === 1 ? 'safy.alrahman@elezaby.com' : `emp${emp.employee_id}@elezaby.com`,
          token: `jwt-elezaby-${Date.now()}`
        }
      });
    }

    // Hybrid Fallback Mode
    const store = getMemoryStore();
    const employees = store.employees || [];
    const branches = store.branches || [];

    const emp = employees.find(e =>
      String(e.employee_id) === cleanUser ||
      String(e.national_id) === cleanUser ||
      (cleanUser === 'safy.alrahman' && e.employee_id === 1) ||
      (cleanUser === 'emp1' && e.employee_id === 1) ||
      (cleanUser === 'emp2' && e.employee_id === 2) ||
      (cleanUser === 'emp5' && e.employee_id === 5) ||
      e.employee_name.toLowerCase().includes(cleanUser)
    );

    if (!emp) {
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو الرقم القومي غير مسجل' });
    }

    const branch = branches.find(b => b.branch_id === emp.branch_id);
    const role = emp.job_title?.includes('مدير') ? 'Manager' :
                 emp.job_title?.includes('صيدلي') ? 'Pharmacist' :
                 emp.job_title?.includes('دليفري') ? 'Driver' : 'Cashier';

    return res.json({
      success: true,
      user: {
        id: emp.employee_id,
        name: emp.employee_id === 1 ? 'د. صفي الرحمن' : emp.employee_name,
        national_id: String(emp.national_id),
        role,
        role_ar: emp.job_title,
        branch_id: emp.branch_id,
        branch_name: branch ? branch.branch_name : 'فرع العزبي - مدينة نصر الرئيسي',
        email: emp.employee_id === 1 ? 'safy.alrahman@elezaby.com' : `emp${emp.employee_id}@elezaby.com`,
        token: `jwt-elezaby-${Date.now()}`
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
