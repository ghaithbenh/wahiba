const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const categoriesRoutes = require('./routes/categories');
const dressesRoutes = require('./routes/dresses');
const schedulesRoutes = require('./routes/schedules');
const contactsRoutes = require('./routes/contacts');
const revenuesRoutes = require('./routes/revenues');
const bannersRoutes = require('./routes/banners');
const aboutUsImagesRoutes = require('./routes/about-us-images');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wahiba Bridal World API is running',
    timestamp: new Date().toISOString()
  });
});

// alias pour le proxy front
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});




// API Routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/dresses', dressesRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/revenues', revenuesRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/about-us-images', aboutUsImagesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      success: false, 
      error: 'File size too large. Maximum size is 5MB.' 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Starting server without database connection. Please check your database configuration.');
  }
  
  app.listen(PORT, () => {
    console.log('\n=================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log('=================================\n');
  });
};

startServer();

module.exports = app;



