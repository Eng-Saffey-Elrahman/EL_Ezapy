const { sql, getPool, isDbConnected, getMemoryStore } = require('../config/db');

exports.getBranchInventory = async (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId, 10) || 1;

    if (isDbConnected()) {
      const pool = getPool();
      const result = await pool.request()
        .input('bid', sql.Int, branchId)
        .query(`
          SELECT bi.inventory_id AS id, bi.branch_id, b.branch_name,
                 bi.medicine_id, m.medicine_name,
                 ('MED-' + CAST(1000 + m.medicine_id AS VARCHAR)) AS medicine_code,
                 m.medicine_type AS category, m.price,
                 CONVERT(VARCHAR(10), bi.expiry_date_batch, 120) AS expiry_date,
                 bi.available_quantity AS quantity,
                 bi.reorder_level,
                 bi.shelf_location,
                 CASE WHEN bi.available_quantity <= bi.reorder_level THEN 1 ELSE 0 END AS is_low_stock
          FROM BRANCH_INVENTORY bi
          LEFT JOIN BRANCH b ON bi.branch_id = b.branch_id
          LEFT JOIN MEDICINE m ON bi.medicine_id = m.medicine_id
          WHERE bi.branch_id = @bid
          ORDER BY bi.inventory_id ASC
        `);
      return res.json({ success: true, data: result.recordset });
    }

    const store = getMemoryStore();
    const inventory = (store.branchInventory || []).filter(i => i.branch_id === branchId);
    const medicines = store.medicines || [];
    const branches = store.branches || [];

    const result = inventory.map(item => {
      const med = medicines.find(m => m.medicine_id === item.medicine_id) || {};
      const branch = branches.find(b => b.branch_id === item.branch_id) || {};
      const isLow = Number(item.available_quantity) <= Number(item.reorder_level);

      return {
        id: item.inventory_id,
        branch_id: item.branch_id,
        branch_name: branch.branch_name || `فرع #${item.branch_id}`,
        medicine_id: item.medicine_id,
        medicine_name: med.medicine_name || `دواء #${item.medicine_id}`,
        medicine_code: `MED-${1000 + item.medicine_id}`,
        category: med.medicine_type || '',
        price: Number(med.price || 0),
        expiry_date: item.expiry_date_batch,
        quantity: Number(item.available_quantity),
        reorder_level: Number(item.reorder_level),
        shelf_location: item.shelf_location,
        is_low_stock: isLow
      };
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateShelf = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { shelf_location } = req.body;
    if (!shelf_location) {
      return res.status(400).json({ success: false, message: 'موقع الرف مطلوب' });
    }

    if (isDbConnected()) {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .input('shelf', sql.VarChar(50), shelf_location.trim())
        .query('UPDATE BRANCH_INVENTORY SET shelf_location = @shelf WHERE inventory_id = @id');
      return res.json({ success: true, message: 'تم تحديث موقع الرف بنجاح' });
    }

    const store = getMemoryStore();
    const item = (store.branchInventory || []).find(i => i.inventory_id === id);
    if (!item) return res.status(404).json({ success: false, message: 'عنصر المخزون غير موجود' });
    item.shelf_location = shelf_location.trim();
    return res.json({ success: true, message: 'تم التحديث' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
