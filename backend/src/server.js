const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectDB, isDbConnected } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'El Ezaby Pharmacy Management System API',
    database: isDbConnected() ? 'Microsoft SQL Server (Live)' : 'Hybrid In-Memory Storage (Fallback Active)',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'حدث خطأ غير متوقع في الخادم'
  });
});

// Start Server & Connect to DB
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 El Ezaby Pharmacy Backend Server Running on Port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
