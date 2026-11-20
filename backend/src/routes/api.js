const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/authController');
const branchCtrl = require('../controllers/branchController');
const warehouseCtrl = require('../controllers/warehouseController');
const supplierCtrl = require('../controllers/supplierController');
const medicineCtrl = require('../controllers/medicineController');
const employeeCtrl = require('../controllers/employeeController');
const customerCtrl = require('../controllers/customerController');
const inventoryCtrl = require('../controllers/inventoryController');
const posCtrl = require('../controllers/posController');
const deliveryCtrl = require('../controllers/deliveryController');
const reportCtrl = require('../controllers/reportController');

// 1. Auth Routes
router.post('/auth/login', authCtrl.login);

// 2. Branch Routes
router.get('/branches', branchCtrl.getAll);
router.get('/branches/:id', branchCtrl.getById);
router.post('/branches', branchCtrl.create);
router.put('/branches/:id', branchCtrl.update);
router.delete('/branches/:id', branchCtrl.delete);

// 3. Central Warehouse Routes
router.get('/warehouses', warehouseCtrl.getAll);
router.get('/warehouses/central/inventory', warehouseCtrl.getCentralInventory);

// 4. Supplier Routes
router.get('/suppliers', supplierCtrl.getAll);
router.post('/suppliers', supplierCtrl.create);
router.delete('/suppliers/:id', supplierCtrl.delete);

// 5. Medicine Routes
router.get('/medicines', medicineCtrl.getAll);
router.post('/medicines', medicineCtrl.create);
router.delete('/medicines/:id', medicineCtrl.delete);

// 6. Employee Routes
router.get('/employees', employeeCtrl.getAll);
router.post('/employees', employeeCtrl.create);
router.delete('/employees/:id', employeeCtrl.delete);

// 7. Customer Routes
router.get('/customers', customerCtrl.getAll);
router.post('/customers', customerCtrl.create);

// 8. Branch Inventory Routes
router.get('/inventory/branch/:branchId', inventoryCtrl.getBranchInventory);
router.put('/inventory/:id/shelf', inventoryCtrl.updateShelf);

// 9. POS & Checkout (ACID Transaction)
router.post('/pos/checkout', posCtrl.checkout);

// 10. Delivery Orders
router.get('/deliveries', deliveryCtrl.getAll);
router.put('/deliveries/:id/status', deliveryCtrl.updateStatus);

// 11. Reports & KPIs
router.get('/reports/summary', reportCtrl.getSummary);

module.exports = router;
