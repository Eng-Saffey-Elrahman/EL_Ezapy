import {
  initialBranches,
  initialWarehouses,
  initialSuppliers,
  initialMedicines,
  initialCentralInventory,
  initialBranchInventory,
  initialEmployees,
  initialCustomers,
  initialInvoices,
  initialDeliveries
} from './mockData';

// Helper for LocalStorage Persistence with Auto-Sync for SQLQuery1.sql seed
const STORAGE_VERSION = 'elezaby_sql_v2';

const checkVersionMigration = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const currentVer = localStorage.getItem('pms_db_version');
    if (currentVer !== STORAGE_VERSION) {
      // Clear old dummy mock data so the new 50 SQL records take effect immediately
      const keysToClear = [
        'pms_branches',
        'pms_warehouses',
        'pms_suppliers',
        'pms_medicines',
        'pms_central_inventory',
        'pms_branch_inventory',
        'pms_employees',
        'pms_customers',
        'pms_invoices',
        'pms_deliveries'
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('pms_db_version', STORAGE_VERSION);
    }
  }
};
checkVersionMigration();

const getStorage = (key, defaultVal) => {
  const data = localStorage.getItem(`pms_${key}`);
  if (!data) {
    localStorage.setItem(`pms_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    const parsed = JSON.parse(data);
    if (parsed.id === 1 && parsed.name && parsed.name.includes('أحمد سامي')) {
      parsed.name = 'د. صفي الرحمن';
      parsed.email = 'safy.alrahman@elezaby.com';
      localStorage.setItem('pms_auth_user', JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return defaultVal;
  }
};

const setStorage = (key, val) => {
  localStorage.setItem(`pms_${key}`, JSON.stringify(val));
};

// Simulation of network delay for realistic loading states
const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const API_BASE = 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    return null;
  }
}

// ==========================================
// 1. AUTH SERVICE
// ==========================================
export const authService = {
  async login({ username, password }) {
    await delay(300);
    const employees = getStorage('employees', initialEmployees);
    const user = employees.find(
      (e) => e.username?.toLowerCase() === username?.trim().toLowerCase() ||
             e.email?.toLowerCase() === username?.trim().toLowerCase() ||
             e.national_id === username?.trim()
    );

    if (!user) {
      throw new Error('اسم المستخدم أو البريد الإلكتروني غير صحيح');
    }

    // Default password check (demo accepts any 4+ char password or 'admin123')
    if (!password || password.length < 3) {
      throw new Error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      national_id: user.national_id,
      role: user.role,
      role_ar: user.role_ar,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      email: user.email,
      token: `fake-jwt-token-${Date.now()}`
    };

    localStorage.setItem('pms_auth_user', JSON.stringify(sessionData));
    return sessionData;
  },

  getCurrentUser() {
    const data = localStorage.getItem('pms_auth_user');
    if (!data) {
      // Default to main branch manager for seamless university demo
      const defaultUser = {
        id: 1,
        name: "د. صفي الرحمن",
        national_id: "29501011234567",
        role: "Manager",
        role_ar: "مدير فرع",
        branch_id: 1,
        branch_name: "فرع مدينة نصر (الرئيسي)",
        email: "safy.alrahman@elezaby.com",
        token: "demo-token"
      };
      localStorage.setItem('pms_auth_user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    const parsed = JSON.parse(data);
    if (parsed.id === 1 && parsed.name && parsed.name.includes('أحمد سامي')) {
      parsed.name = 'د. صفي الرحمن';
      parsed.email = 'safy.alrahman@elezaby.com';
      localStorage.setItem('pms_auth_user', JSON.stringify(parsed));
    }
    return parsed;
  },

  logout() {
    localStorage.removeItem('pms_auth_user');
    return true;
  }
};

// ==========================================
// 2. SUPPLIERS SERVICE
// ==========================================
export const supplierService = {
  async getAll() {
    await delay();
    return getStorage('suppliers', initialSuppliers);
  },

  async getById(id) {
    await delay();
    const suppliers = getStorage('suppliers', initialSuppliers);
    const item = suppliers.find((s) => s.id === Number(id));
    if (!item) throw new Error('المورد غير موجود');
    return item;
  },

  async create(data) {
    await delay();
    const suppliers = getStorage('suppliers', initialSuppliers);
    const newId = suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
    const newSupplier = {
      id: newId,
      name: data.name.trim(),
      email: data.email?.trim() || '',
      address: data.address?.trim() || '',
      phones: Array.isArray(data.phones) ? data.phones.filter(p => p && p.trim()) : [data.phone || '']
    };
    suppliers.unshift(newSupplier);
    setStorage('suppliers', suppliers);
    return newSupplier;
  },

  async update(id, data) {
    await delay();
    const suppliers = getStorage('suppliers', initialSuppliers);
    const index = suppliers.findIndex(s => s.id === Number(id));
    if (index === -1) throw new Error('المورد غير موجود');

    suppliers[index] = {
      ...suppliers[index],
      name: data.name.trim(),
      email: data.email?.trim() || '',
      address: data.address?.trim() || '',
      phones: Array.isArray(data.phones) ? data.phones.filter(p => p && p.trim()) : suppliers[index].phones
    };

    setStorage('suppliers', suppliers);
    return suppliers[index];
  },

  async delete(id) {
    await delay();
    const medicines = getStorage('medicines', initialMedicines);
    const linkedMedicines = medicines.filter(m => m.supplier_id === Number(id));
    if (linkedMedicines.length > 0) {
      throw new Error(`لا يمكن حذف هذا المورد لوجود ${linkedMedicines.length} أدوية مرتبطة به في النظام.`);
    }

    let suppliers = getStorage('suppliers', initialSuppliers);
    suppliers = suppliers.filter(s => s.id !== Number(id));
    setStorage('suppliers', suppliers);
    return true;
  }
};

// ==========================================
// 3. MEDICINES SERVICE
// ==========================================
export const medicineService = {
  async getAll() {
    const res = await apiFetch('/medicines');
    if (res && res.success && res.data) return res.data;
    await delay();
    return getStorage('medicines', initialMedicines);
  },

  async getById(id) {
    await delay();
    const medicines = getStorage('medicines', initialMedicines);
    const med = medicines.find(m => m.id === Number(id));
    if (!med) throw new Error('الدواء غير موجود');
    return med;
  },

  async create(data) {
    await delay();
    const medicines = getStorage('medicines', initialMedicines);
    const suppliers = getStorage('suppliers', initialSuppliers);
    const supplier = suppliers.find(s => s.id === Number(data.supplier_id));

    const newId = medicines.length ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
    const newMedicine = {
      id: newId,
      code: data.code || `MED-${1000 + newId}`,
      name: data.name.trim(),
      category: data.category || 'عام',
      dosage_form: data.dosage_form || 'أقراص',
      supplier_id: Number(data.supplier_id),
      supplier_name: supplier ? supplier.name : 'غير محدد',
      price: Number(data.price),
      cost_price: Number(data.cost_price || data.price * 0.7),
      expiry_date: data.expiry_date,
      status: data.status || 'Active',
      barcode: data.barcode || `622123456${String(newId).padStart(3, '0')}`
    };

    medicines.unshift(newMedicine);
    setStorage('medicines', medicines);

    // Automatically initialize in Central Warehouse
    const centralInv = getStorage('central_inventory', initialCentralInventory);
    centralInv.push({
      id: centralInv.length + 1,
      warehouse_id: 1,
      medicine_id: newId,
      quantity: Number(data.initial_central_qty || 100),
      batch_no: `BATCH-${new Date().getFullYear()}-${String(newId).padStart(2, '0')}`
    });
    setStorage('central_inventory', centralInv);

    return newMedicine;
  },

  async update(id, data) {
    await delay();
    const medicines = getStorage('medicines', initialMedicines);
    const index = medicines.findIndex(m => m.id === Number(id));
    if (index === -1) throw new Error('الدواء غير موجود');

    const suppliers = getStorage('suppliers', initialSuppliers);
    const supplier = suppliers.find(s => s.id === Number(data.supplier_id));

    medicines[index] = {
      ...medicines[index],
      code: data.code || medicines[index].code,
      name: data.name.trim(),
      category: data.category || medicines[index].category,
      dosage_form: data.dosage_form || medicines[index].dosage_form,
      supplier_id: Number(data.supplier_id),
      supplier_name: supplier ? supplier.name : medicines[index].supplier_name,
      price: Number(data.price),
      cost_price: Number(data.cost_price || medicines[index].cost_price),
      expiry_date: data.expiry_date || medicines[index].expiry_date,
      status: data.status || medicines[index].status,
      barcode: data.barcode || medicines[index].barcode
    };

    setStorage('medicines', medicines);
    return medicines[index];
  },

  async delete(id) {
    await delay();
    let medicines = getStorage('medicines', initialMedicines);
    medicines = medicines.filter(m => m.id !== Number(id));
    setStorage('medicines', medicines);
    return true;
  }
};

// ==========================================
// 4. BRANCHES & WAREHOUSES SERVICE
// ==========================================
export const branchService = {
  async getAll() {
    const res = await apiFetch('/branches');
    if (res && res.success && res.data) return res.data;
    await delay();
    return getStorage('branches', initialBranches);
  },

  async getById(id) {
    await delay();
    const branches = getStorage('branches', initialBranches);
    const b = branches.find(item => item.id === Number(id));
    if (!b) throw new Error('الفرع غير موجود');
    return b;
  },

  async create(data) {
    await delay();
    const branches = getStorage('branches', initialBranches);
    const warehouses = getStorage('warehouses', initialWarehouses);
    const employees = getStorage('employees', initialEmployees);

    const warehouse = warehouses.find(w => w.id === Number(data.warehouse_id));
    const manager = employees.find(e => e.id === Number(data.manager_id));

    const newId = branches.length ? Math.max(...branches.map(b => b.id)) + 1 : 1;
    const newBranch = {
      id: newId,
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      warehouse_id: Number(data.warehouse_id),
      warehouse_name: warehouse ? warehouse.name : 'المخزن الرئيسي',
      manager_id: Number(data.manager_id),
      manager_name: manager ? manager.name : 'غير محدد',
      start_date: data.start_date || new Date().toISOString().split('T')[0]
    };

    branches.push(newBranch);
    setStorage('branches', branches);
    return newBranch;
  },

  async update(id, data) {
    await delay();
    const branches = getStorage('branches', initialBranches);
    const index = branches.findIndex(b => b.id === Number(id));
    if (index === -1) throw new Error('الفرع غير موجود');

    const warehouses = getStorage('warehouses', initialWarehouses);
    const employees = getStorage('employees', initialEmployees);
    const warehouse = warehouses.find(w => w.id === Number(data.warehouse_id));
    const manager = employees.find(e => e.id === Number(data.manager_id));

    branches[index] = {
      ...branches[index],
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      warehouse_id: Number(data.warehouse_id),
      warehouse_name: warehouse ? warehouse.name : branches[index].warehouse_name,
      manager_id: Number(data.manager_id),
      manager_name: manager ? manager.name : branches[index].manager_name,
      start_date: data.start_date || branches[index].start_date
    };

    setStorage('branches', branches);
    return branches[index];
  },

  async delete(id) {
    await delay();
    let branches = getStorage('branches', initialBranches);
    branches = branches.filter(b => b.id !== Number(id));
    setStorage('branches', branches);
    return true;
  }
};

export const warehouseService = {
  async getAllWarehouses() {
    await delay();
    return getStorage('warehouses', initialWarehouses);
  },

  async getCentralWarehouse() {
    await delay();
    const warehouses = getStorage('warehouses', initialWarehouses);
    return warehouses[0];
  },

  async getCentralInventory() {
    await delay();
    const central = getStorage('central_inventory', initialCentralInventory);
    const medicines = getStorage('medicines', initialMedicines);
    const suppliers = getStorage('suppliers', initialSuppliers);

    return central.map((item) => {
      const med = medicines.find(m => m.id === item.medicine_id) || {};
      const sup = suppliers.find(s => s.id === med.supplier_id) || {};
      return {
        ...item,
        medicine_name: med.name || 'غير معروف',
        medicine_code: med.code || '',
        category: med.category || '',
        supplier_name: sup.name || med.supplier_name || '',
        expiry_date: med.expiry_date || '',
        price: med.price || 0
      };
    });
  },

  async receiveShipment({ medicine_id, quantity, batch_no }) {
    await delay();
    const central = getStorage('central_inventory', initialCentralInventory);
    const existingIndex = central.findIndex(i => i.medicine_id === Number(medicine_id));
    if (existingIndex > -1) {
      central[existingIndex].quantity += Number(quantity);
      if (batch_no) central[existingIndex].batch_no = batch_no;
    } else {
      central.push({
        id: central.length + 1,
        warehouse_id: 1,
        medicine_id: Number(medicine_id),
        quantity: Number(quantity),
        batch_no: batch_no || `BATCH-${Date.now().toString().slice(-4)}`
      });
    }
    setStorage('central_inventory', central);
    return true;
  },

  async transferToBranch({ branch_id, medicine_id, quantity }) {
    await delay();
    const qty = Number(quantity);
    const central = getStorage('central_inventory', initialCentralInventory);
    const centralItem = central.find(i => i.medicine_id === Number(medicine_id));

    if (!centralItem || centralItem.quantity < qty) {
      throw new Error(`الكمية المتاحة في المخزن المركزي (${centralItem ? centralItem.quantity : 0}) لا تكفي للتحويل!`);
    }

    // Deduct from central
    centralItem.quantity -= qty;
    setStorage('central_inventory', central);

    // Add to branch inventory
    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const bItem = branchInv.find(i => i.branch_id === Number(branch_id) && i.medicine_id === Number(medicine_id));

    if (bItem) {
      bItem.quantity += qty;
    } else {
      branchInv.push({
        id: branchInv.length + 1,
        branch_id: Number(branch_id),
        medicine_id: Number(medicine_id),
        quantity: qty,
        reorder_level: 10,
        shelf_location: "A1-01"
      });
    }
    setStorage('branch_inventory', branchInv);
    return true;
  }
};

// ==========================================
// 5. EMPLOYEES SERVICE
// ==========================================
export const employeeService = {
  async getAll() {
    await delay();
    return getStorage('employees', initialEmployees);
  },

  async getById(id) {
    await delay();
    const employees = getStorage('employees', initialEmployees);
    const emp = employees.find(e => e.id === Number(id));
    if (!emp) throw new Error('الموظف غير موجود');
    return emp;
  },

  async create(data) {
    await delay();
    const employees = getStorage('employees', initialEmployees);

    // Constraint: Unique National ID
    const exists = employees.some(e => e.national_id === data.national_id.trim());
    if (exists) {
      throw new Error('الرقم القومي مسجل بالفعل لموظف آخر.');
    }

    const branches = getStorage('branches', initialBranches);
    const branch = branches.find(b => b.id === Number(data.branch_id));
    if (!branch) {
      throw new Error('يجب اختيار فرع صحيح للموظف.');
    }

    const newId = employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    const newEmp = {
      id: newId,
      name: data.name.trim(),
      national_id: data.national_id.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      email: data.email.trim(),
      role: data.role || 'Pharmacist',
      role_ar: data.role === 'Manager' ? 'مدير فرع' : (data.role === 'Cashier' ? 'كاشير ومبيعات' : (data.role === 'Driver' ? 'سائق توصيل' : 'صيدلي')),
      branch_id: Number(data.branch_id),
      branch_name: branch.name,
      username: data.username || data.name.trim().toLowerCase().replace(/\s+/g, '.')
    };

    employees.push(newEmp);
    setStorage('employees', employees);
    return newEmp;
  },

  async update(id, data) {
    await delay();
    const employees = getStorage('employees', initialEmployees);
    const index = employees.findIndex(e => e.id === Number(id));
    if (index === -1) throw new Error('الموظف غير موجود');

    // Constraint: Unique National ID for other employees
    const exists = employees.some(e => e.id !== Number(id) && e.national_id === data.national_id.trim());
    if (exists) {
      throw new Error('الرقم القومي مسجل بالفعل لموظف آخر.');
    }

    const branches = getStorage('branches', initialBranches);
    const branch = branches.find(b => b.id === Number(data.branch_id));

    employees[index] = {
      ...employees[index],
      name: data.name.trim(),
      national_id: data.national_id.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      email: data.email.trim(),
      role: data.role || employees[index].role,
      role_ar: data.role === 'Manager' ? 'مدير فرع' : (data.role === 'Cashier' ? 'كاشير ومبيعات' : (data.role === 'Driver' ? 'سائق توصيل' : 'صيدلي')),
      branch_id: Number(data.branch_id),
      branch_name: branch ? branch.name : employees[index].branch_name
    };

    setStorage('employees', employees);
    return employees[index];
  },

  async delete(id) {
    await delay();
    let employees = getStorage('employees', initialEmployees);
    employees = employees.filter(e => e.id !== Number(id));
    setStorage('employees', employees);
    return true;
  }
};

// ==========================================
// 6. CUSTOMERS SERVICE
// ==========================================
export const customerService = {
  async getAll() {
    await delay();
    return getStorage('customers', initialCustomers);
  },

  async getById(id) {
    await delay();
    const customers = getStorage('customers', initialCustomers);
    const cust = customers.find(c => c.id === Number(id));
    if (!cust) throw new Error('العميل غير موجود');
    return cust;
  },

  async create(data) {
    await delay();
    const customers = getStorage('customers', initialCustomers);

    const newId = customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const newCust = {
      id: newId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      address: data.address.trim(),
      loyalty_points: Number(data.loyalty_points || 0),
      created_at: new Date().toISOString().split('T')[0]
    };

    customers.unshift(newCust);
    setStorage('customers', customers);
    return newCust;
  },

  async update(id, data) {
    await delay();
    const customers = getStorage('customers', initialCustomers);
    const index = customers.findIndex(c => c.id === Number(id));
    if (index === -1) throw new Error('العميل غير موجود');

    customers[index] = {
      ...customers[index],
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      address: data.address.trim()
      // Note: loyalty_points cannot be manually altered arbitrarily
    };

    setStorage('customers', customers);
    return customers[index];
  },

  async delete(id) {
    await delay();
    let customers = getStorage('customers', initialCustomers);
    customers = customers.filter(c => c.id !== Number(id));
    setStorage('customers', customers);
    return true;
  },

  async getPurchaseHistory(customerId) {
    await delay();
    const invoices = getStorage('invoices', initialInvoices);
    return invoices.filter(inv => inv.customer_id === Number(customerId));
  }
};

// ==========================================
// 7. BRANCH INVENTORY SERVICE
// ==========================================
export const branchInventoryService = {
  async getBranchInventory(branchId = 1) {
    await delay();
    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const medicines = getStorage('medicines', initialMedicines);
    const branches = getStorage('branches', initialBranches);

    const bId = Number(branchId);
    const filtered = branchInv.filter(i => i.branch_id === bId);

    return filtered.map(item => {
      const med = medicines.find(m => m.id === item.medicine_id) || {};
      const branch = branches.find(b => b.id === item.branch_id) || {};
      const isLowStock = item.quantity <= item.reorder_level;

      return {
        ...item,
        medicine_name: med.name || 'دواء غير محدد',
        medicine_code: med.code || '',
        category: med.category || '',
        price: med.price || 0,
        expiry_date: med.expiry_date || '',
        med_status: med.status || 'Active',
        branch_name: branch.name || '',
        is_low_stock: isLowStock
      };
    });
  },

  async updateShelfLocation(inventoryId, shelf_location) {
    await delay();
    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const item = branchInv.find(i => i.id === Number(inventoryId));
    if (!item) throw new Error('عنصر المخزون غير موجود');
    item.shelf_location = shelf_location.trim();
    setStorage('branch_inventory', branchInv);
    return item;
  },

  async updateReorderLevel(inventoryId, reorder_level) {
    await delay();
    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const item = branchInv.find(i => i.id === Number(inventoryId));
    if (!item) throw new Error('عنصر المخزون غير موجود');
    item.reorder_level = Number(reorder_level);
    setStorage('branch_inventory', branchInv);
    return item;
  }
};

// ==========================================
// 8. POS & TRANSACTION SERVICE
// ==========================================
export const posService = {
  // Returns medicines with current branch stock for fast search in POS
  async getBranchStockList(branchId = 1) {
    return branchInventoryService.getBranchInventory(branchId);
  },

  // ACID TRANSACTION SIMULATION WITH BACKEND CONNECTION
  async checkoutInvoice(payload) {
    const res = await apiFetch('/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      const branchInv = getStorage('branch_inventory', initialBranchInventory);
      for (const item of (payload.items || [])) {
        const rec = branchInv.find(i => i.branch_id === Number(payload.branch_id) && i.medicine_id === Number(item.medicine_id));
        if (rec) rec.quantity -= Number(item.quantity);
      }
      setStorage('branch_inventory', branchInv);

      const branches = getStorage('branches', initialBranches);
      const branch = branches.find(b => b.id === Number(payload.branch_id));
      const customers = getStorage('customers', initialCustomers);
      const customer = payload.customer_id ? customers.find(c => c.id === Number(payload.customer_id)) : null;

      const newInvoice = {
        id: res.invoice_id,
        invoice_number: res.invoice_number,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        branch_id: payload.branch_id,
        branch_name: branch ? branch.name : 'فرع العزبي الرئيسي',
        employee_id: payload.employee_id,
        employee_name: payload.employee_name || 'د. صفي الرحمن',
        customer_id: payload.customer_id || 1,
        customer_name: customer ? customer.name : 'عميل نقدي عام',
        subtotal: payload.subtotal,
        discount_amount: payload.discount_amount,
        net_total: payload.net_total,
        payment_method: payload.payment_method,
        payment_method_ar: payload.payment_method === 'Cash' ? 'نقدي' : (payload.payment_method === 'Card' ? 'فيزا' : 'محفظة إلكترونية'),
        is_delivery: !!payload.delivery_required,
        delivery_details: payload.delivery_details,
        items: payload.items
      };

      const invoices = getStorage('invoices', initialInvoices);
      invoices.unshift(newInvoice);
      setStorage('invoices', invoices);

      return newInvoice;
    }

    await delay(350);

    const {
      branch_id,
      employee_id,
      employee_name,
      customer_id,
      items,
      subtotal,
      discount_amount,
      net_total,
      payment_method,
      delivery_required,
      delivery_details
    } = payload;

    if (!items || items.length === 0) {
      throw new Error('لا يمكن حفظ فاتورة فارغة. يرجى إضافة دواء واحد على الأقل.');
    }

    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const medicines = getStorage('medicines', initialMedicines);
    const branches = getStorage('branches', initialBranches);
    const customers = getStorage('customers', initialCustomers);

    const branch = branches.find(b => b.id === Number(branch_id));
    const customer = customer_id ? customers.find(c => c.id === Number(customer_id)) : null;

    // STEP 1: TRANSACTION CHECK - Validate Stock Limits
    for (const item of items) {
      const invRecord = branchInv.find(
        i => i.branch_id === Number(branch_id) && i.medicine_id === Number(item.medicine_id)
      );

      const availableQty = invRecord ? invRecord.quantity : 0;
      if (!invRecord || availableQty < Number(item.quantity)) {
        const med = medicines.find(m => m.id === Number(item.medicine_id));
        const medName = med ? med.name : `دواء #${item.medicine_id}`;
        throw new Error(
          `فشل حفظ الفاتورة (Rollback): الكمية المطلوبة من (${medName}) هي ${item.quantity} عبوة، بينما المتاح في مخزون الفرع هو ${availableQty} عبوة فقط!`
        );
      }
    }

    // STEP 2: DEDUCT FROM BRANCH INVENTORY
    for (const item of items) {
      const invRecord = branchInv.find(
        i => i.branch_id === Number(branch_id) && i.medicine_id === Number(item.medicine_id)
      );
      invRecord.quantity -= Number(item.quantity);
    }
    setStorage('branch_inventory', branchInv);

    // STEP 3: CREATE INVOICE RECORD
    const invoices = getStorage('invoices', initialInvoices);
    const newInvoiceId = invoices.length ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(newInvoiceId).padStart(4, '0')}`;

    // Structure sequential item IDs (1, 2, 3...) as strictly requested
    const structuredItems = items.map((it, idx) => ({
      item_id: idx + 1,
      medicine_id: Number(it.medicine_id),
      medicine_name: it.medicine_name,
      unit_price: Number(it.unit_price),
      quantity: Number(it.quantity),
      discount: Number(it.discount || 0),
      line_total: Number(it.line_total)
    }));

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newInvoice = {
      id: newInvoiceId,
      invoice_number: invoiceNumber,
      created_at: formattedDate,
      branch_id: Number(branch_id),
      branch_name: branch ? branch.name : 'فرع الصيدلية',
      employee_id: Number(employee_id),
      employee_name: employee_name || 'موظف الصيدلية',
      customer_id: customer ? customer.id : null,
      customer_name: customer ? customer.name : 'عميل نقدي (Walk-in)',
      subtotal: Number(subtotal),
      discount_amount: Number(discount_amount || 0),
      net_total: Number(net_total),
      payment_method: payment_method || 'Cash',
      is_delivery: Boolean(delivery_required),
      items: structuredItems
    };

    invoices.unshift(newInvoice);
    setStorage('invoices', invoices);

    // STEP 4: UPDATE CUSTOMER LOYALTY POINTS (1 pt per 10 EGP spent)
    if (customer) {
      const earnedPoints = Math.floor(Number(net_total) / 10);
      customer.loyalty_points = (customer.loyalty_points || 0) + earnedPoints;
      setStorage('customers', customers);
    }

    // STEP 5: CREATE DELIVERY RECORD IF REQUIRED
    let createdDelivery = null;
    if (delivery_required && delivery_details) {
      const deliveries = getStorage('deliveries', initialDeliveries);
      const newDelId = deliveries.length ? Math.max(...deliveries.map(d => d.id)) + 1 : 1;
      createdDelivery = {
        id: newDelId,
        delivery_number: `DEL-${String(newDelId).padStart(3, '0')}`,
        invoice_id: newInvoiceId,
        invoice_number: invoiceNumber,
        customer_name: customer ? customer.name : (delivery_details.customer_name || 'عميل خارجي'),
        customer_phone: customer ? customer.phone : (delivery_details.customer_phone || ''),
        delivery_address: delivery_details.address || (customer ? customer.address : 'عنوان غير محدد'),
        driver_id: delivery_details.driver_id ? Number(delivery_details.driver_id) : 5,
        driver_name: delivery_details.driver_name || 'ياسر إبراهيم',
        delivery_fee: Number(delivery_details.fee || 20.00),
        status: 'Pending',
        dispatched_at: null,
        delivered_at: null
      };
      deliveries.unshift(createdDelivery);
      setStorage('deliveries', deliveries);
    }

    return {
      success: true,
      invoice: newInvoice,
      delivery: createdDelivery
    };
  }
};

// ==========================================
// 9. DELIVERY SERVICE
// ==========================================
export const deliveryService = {
  async getAll() {
    await delay();
    return getStorage('deliveries', initialDeliveries);
  },

  async updateStatus(id, newStatus) {
    await delay();
    const deliveries = getStorage('deliveries', initialDeliveries);
    const item = deliveries.find(d => d.id === Number(id));
    if (!item) throw new Error('طلب التوصيل غير موجود');

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    item.status = newStatus;
    if (newStatus === 'Out for Delivery' && !item.dispatched_at) {
      item.dispatched_at = timeStr;
    } else if (newStatus === 'Delivered') {
      item.delivered_at = timeStr;
    }

    setStorage('deliveries', deliveries);
    return item;
  }
};

// ==========================================
// 10. REPORTS & DASHBOARD SERVICE
// ==========================================
export const reportService = {
  async getDashboardData(branchId = 1) {
    await delay(200);
    const invoices = getStorage('invoices', initialInvoices);
    const customers = getStorage('customers', initialCustomers);
    const branchInv = getStorage('branch_inventory', initialBranchInventory);
    const medicines = getStorage('medicines', initialMedicines);
    const deliveries = getStorage('deliveries', initialDeliveries);

    // Filter today's invoices
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter(inv => inv.created_at.startsWith(todayStr) || true); // fallback for demo data

    const totalSalesToday = todayInvoices.reduce((sum, inv) => sum + Number(inv.net_total), 0);
    const todayInvoicesCount = todayInvoices.length;
    const totalCustomersCount = customers.length;

    // Inventory calculations for selected branch
    const bInv = branchInv.filter(i => i.branch_id === Number(branchId));
    const totalMedicinesStock = bInv.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockItems = bInv.filter(i => i.quantity <= i.reorder_level);

    // Medicines expiry calculations
    const todayDate = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(todayDate.getDate() + 45);

    let expiredCount = 0;
    let nearExpiryCount = 0;

    medicines.forEach(m => {
      const exp = new Date(m.expiry_date);
      if (exp < todayDate) {
        expiredCount++;
      } else if (exp <= thirtyDaysAhead) {
        nearExpiryCount++;
      }
    });

    // Branch sales summary
    const branches = getStorage('branches', initialBranches);
    const branchSales = branches.map(b => {
      const bInvs = invoices.filter(inv => inv.branch_id === b.id);
      const bTotal = bInvs.reduce((sum, inv) => sum + Number(inv.net_total), 0);
      return {
        branch_id: b.id,
        branch_name: b.name,
        total_sales: bTotal,
        invoices_count: bInvs.length
      };
    });

    const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;

    return {
      totalSalesToday,
      todayInvoicesCount,
      totalCustomersCount,
      totalMedicinesStock,
      lowStockCount: lowStockItems.length,
      nearExpiryCount,
      expiredCount,
      pendingDeliveries,
      branchSales,
      recentInvoices: invoices.slice(0, 5),
      lowStockAlerts: lowStockItems.slice(0, 6).map(i => {
        const med = medicines.find(m => m.id === i.medicine_id);
        return {
          id: i.id,
          name: med ? med.name : 'دواء',
          quantity: i.quantity,
          reorder_level: i.reorder_level,
          shelf_location: i.shelf_location
        };
      })
    };
  },

  async getFilteredReports({ startDate, endDate, branchId }) {
    await delay(250);
    const invoices = getStorage('invoices', initialInvoices);
    const medicines = getStorage('medicines', initialMedicines);
    const branchInv = getStorage('branch_inventory', initialBranchInventory);

    let filtered = [...invoices];

    if (branchId && branchId !== 'ALL') {
      filtered = filtered.filter(inv => inv.branch_id === Number(branchId));
    }

    if (startDate) {
      filtered = filtered.filter(inv => inv.created_at.split(' ')[0] >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(inv => inv.created_at.split(' ')[0] <= endDate);
    }

    // Top selling calculation
    const salesMap = {};
    filtered.forEach(inv => {
      inv.items.forEach(it => {
        if (!salesMap[it.medicine_name]) {
          salesMap[it.medicine_name] = { name: it.medicine_name, quantity: 0, revenue: 0 };
        }
        salesMap[it.medicine_name].quantity += it.quantity;
        salesMap[it.medicine_name].revenue += it.line_total;
      });
    });

    const topSelling = Object.values(salesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Total metrics
    const totalRevenue = filtered.reduce((acc, cur) => acc + Number(cur.net_total), 0);
    const totalDiscounts = filtered.reduce((acc, cur) => acc + Number(cur.discount_amount || 0), 0);

    return {
      invoices: filtered,
      topSelling,
      totalRevenue,
      totalDiscounts,
      invoicesCount: filtered.length
    };
  }
};
