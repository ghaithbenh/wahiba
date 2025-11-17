const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create category
router.post('/',
  body('name').notEmpty().trim().isLength({ min: 1, max: 255 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name } = req.body;
      
      // Check if category already exists
      const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists' });
      }
      
      const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
      
      res.status(201).json({
        success: true,
        data: { id: result.insertId, name }
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update category
router.put('/:id',
  body('name').notEmpty().trim().isLength({ min: 1, max: 255 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name } = req.body;
      const { id } = req.params;
      
      // Check if category exists
      const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      
      // Check if name is taken by another category
      const [duplicate] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists' });
      }
      
      await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
      
      res.json({
        success: true,
        data: { id: parseInt(id), name }
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



