const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all revenues
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM revenues ORDER BY month DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching revenues:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get revenue by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM revenues WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Revenue record not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get revenue by month
router.get('/month/:month', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM revenues WHERE month = ?', [req.params.month]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Revenue record not found for this month' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update revenue
router.post('/',
  body('month').isDate(),
  body('totalSales').optional().isNumeric(),
  body('salesRevenue').optional().isNumeric(),
  body('totalRental').optional().isNumeric(),
  body('rentalRevenue').optional().isNumeric(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        month,
        totalSales,
        salesRevenue,
        totalRental,
        rentalRevenue
      } = req.body;
      
      // Check if revenue for this month exists
      const [existing] = await pool.query('SELECT id FROM revenues WHERE month = ?', [month]);
      
      if (existing.length > 0) {
        // Update existing
        await pool.query(`
          UPDATE revenues SET
            total_sales = ?,
            sales_revenue = ?,
            total_rental = ?,
            rental_revenue = ?
          WHERE month = ?
        `, [
          totalSales || 0,
          salesRevenue || 0,
          totalRental || 0,
          rentalRevenue || 0,
          month
        ]);
        
        res.json({
          success: true,
          data: { id: existing[0].id, month }
        });
      } else {
        // Insert new
        const [result] = await pool.query(`
          INSERT INTO revenues (month, total_sales, sales_revenue, total_rental, rental_revenue)
          VALUES (?, ?, ?, ?, ?)
        `, [
          month,
          totalSales || 0,
          salesRevenue || 0,
          totalRental || 0,
          rentalRevenue || 0
        ]);
        
        res.status(201).json({
          success: true,
          data: { id: result.insertId, month }
        });
      }
    } catch (error) {
      console.error('Error creating/updating revenue:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete revenue
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM revenues WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Revenue record not found' });
    }
    
    res.json({ success: true, message: 'Revenue record deleted successfully' });
  } catch (error) {
    console.error('Error deleting revenue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



