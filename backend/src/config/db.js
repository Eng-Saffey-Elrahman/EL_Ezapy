const sql = require('mssql');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'admin',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'El_Ezaby_Pharmacy_System',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
    connectTimeout: 7000,
    requestTimeout: 15000
  },
  pool: {
    max: 15,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;
let isConnected = false;

// Fallback in-memory store initialized with exact SQLQuery1.sql seed data
let memoryStore = null;

function loadFallbackData() {
  try {
    const dataPath = path.join(__dirname, '../data/seedData.json');
    if (fs.existsSync(dataPath)) {
      memoryStore = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log('✓ Loaded seedData.json with', memoryStore.branches?.length, 'branches and', memoryStore.medicines?.length, 'medicines.');
    } else {
      console.warn('seedData.json not found at:', dataPath);
    }
  } catch (err) {
    console.warn('Fallback data could not be loaded:', err.message);
  }
}

async function connectDB() {
  loadFallbackData();
  try {
    console.log(`Connecting to Microsoft SQL Server at ${dbConfig.server}:${dbConfig.port}/${dbConfig.database}...`);
    pool = await sql.connect(dbConfig);
    isConnected = true;
    console.log('✓ Successfully connected to Microsoft SQL Server (El_Ezaby_Pharmacy_System)!');
    return pool;
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ Microsoft SQL Server connection failed:', err.message);
    console.log('⚡ Backend switched to High-Performance Hybrid Mode (Serving exact SQLQuery1.sql seed data directly).');
    return null;
  }
}

function getPool() {
  return pool;
}

function isDbConnected() {
  return isConnected;
}

function getMemoryStore() {
  if (!memoryStore) loadFallbackData();
  return memoryStore;
}

module.exports = {
  sql,
  dbConfig,
  connectDB,
  getPool,
  isDbConnected,
  getMemoryStore
};
