const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getSummary = async (req, res) => {
  try {
    if (isDbConnected()) {
      const pool = getPool();
      const stats = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM BRANCH) AS total_branches,
          (SELECT COUNT(*) FROM EMPLOYEE) AS total_employees,
          (SELECT COUNT(*) FROM CUSTOMER) AS total_customers,
          (SELECT COUNT(*) FROM MEDICINE) AS total_medicines,
          (SELECT ISNULL(SUM(total_amount), 0) FROM INVOICE) AS total_revenue,
          (SELECT COUNT(*) FROM INVOICE) AS total_invoices,
          (SELECT COUNT(*) FROM DELIVERY_ORDER) AS total_deliveries,
          (SELECT COUNT(*) FROM BRANCH_INVENTORY WHERE available_quantity <= reorder_level) AS low_stock_alerts
      `);
      return res.json({ success: true, data: stats.recordset[0] });
    }

    const store = getMemoryStore();
    const totalRev = (store.invoices || []).reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
    const lowStock = (store.branchInventory || []).filter(i => Number(i.available_quantity) <= Number(i.reorder_level)).length;

    return res.json({
      success: true,
      data: {
        total_branches: store.branches?.length || 50,
        total_employees: store.employees?.length || 50,
        total_customers: store.customers?.length || 50,
        total_medicines: store.medicines?.length || 50,
        total_revenue: totalRev,
        total_invoices: store.invoices?.length || 50,
        total_deliveries: store.deliveries?.length || 50,
        low_stock_alerts: lowStock
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
