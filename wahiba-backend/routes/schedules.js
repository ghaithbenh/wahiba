const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM schedules';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [schedules] = await pool.query(query, params);
    
    // Fetch items for each schedule
    for (let schedule of schedules) {
      const [items] = await pool.query(
        'SELECT * FROM schedule_items WHERE schedule_id = ?',
        [schedule.id]
      );
      schedule.items = items;
    }
    
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const [schedules] = await pool.query('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    
    if (schedules.length === 0) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    
    const schedule = schedules[0];
    
    const [items] = await pool.query(
      'SELECT * FROM schedule_items WHERE schedule_id = ?',
      [schedule.id]
    );
    schedule.items = items;
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create schedule
router.post('/',
  body('fullName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('items').isArray().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        fullName,
        phone,
        address,
        note,
        tryOnDate,
        items,
        total
      } = req.body;
      
      // Insert schedule
      const [scheduleResult] = await connection.query(`
        INSERT INTO schedules (
          full_name, phone, address, note, try_on_date, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `, [
        fullName,
        phone,
        address || null,
        note || null,
        tryOnDate || null,
        total || 0
      ]);
      
      const scheduleId = scheduleResult.insertId;
      
      // Insert schedule items
      for (let item of items) {
        await connection.query(`
          INSERT INTO schedule_items (
            schedule_id, dress_name, color, size, quantity,
            start_date, end_date, price_per_day, buy_price, type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          scheduleId,
          item.dressName,
          item.color || null,
          item.size || null,
          item.quantity || 1,
          item.startDate || null,
          item.endDate || null,
          item.pricePerDay || null,
          item.buyPrice || null,
          item.type
        ]);
      }
      
      await connection.commit();
      
      res.status(201).json({
        success: true,
        data: { id: scheduleId }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating schedule:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      connection.release();
    }
  }
);

// Update schedule status
router.patch('/:id/status',
  body('status').isIn(['pending', 'apConfirmed', 'confirmed', 'completed', 'cancelled']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [result] = await pool.query(
        'UPDATE schedules SET status = ? WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }
      
      res.json({ success: true, data: { id: parseInt(id), status } });
    } catch (error) {
      console.error('Error updating schedule status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



