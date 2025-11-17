const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const upload = require('../config/upload');

// helpers
const toInt = (v, f = 0) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? f : n;
};
const toTinyIntBool = v =>
  (v === true || v === 'true' || v === 1 || v === '1') ? 1 : 0;

// GET /api/admin/about-images?active=true|false
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;

    let query = 'SELECT * FROM about_us_images';
    const params = [];

    if (active !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(toTinyIntBool(active));
    }

    query += ' ORDER BY sort_order ASC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching about us images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/about-images/:id
router.get('/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM about_us_images WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'About us image not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching about us image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/about-images (field name: image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const imageUrl = `/uploads/about-us/${req.file.filename}`;
    const sortOrder = toInt(req.body.sortOrder, 0);
    const isActive  = toTinyIntBool(req.body.isActive);

    const [result] = await pool.query(
      'INSERT INTO about_us_images (image_url, sort_order, is_active) VALUES (?, ?, ?)',
      [imageUrl, sortOrder, isActive]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        image_url: imageUrl,
        sort_order: sortOrder,
        is_active: isActive
      }
    });
  } catch (error) {
    console.error('Error creating about us image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/about-images/:id
router.put('/:id', async (req, res) => {
  try {
    const id        = toInt(req.params.id);
    const sortOrder = toInt(req.body.sortOrder, 0);
    const isActive  = toTinyIntBool(req.body.isActive);

    const [result] = await pool.query(
      'UPDATE about_us_images SET sort_order = ?, is_active = ? WHERE id = ?',
      [sortOrder, isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'About us image not found' });
    }

    res.json({
      success: true,
      data: { id, sort_order: sortOrder, is_active: isActive }
    });
  } catch (error) {
    console.error('Error updating about us image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/about-images/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);

    const [result] = await pool.query('DELETE FROM about_us_images WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'About us image not found' });
    }

    res.json({ success: true, message: 'About us image deleted successfully' });
  } catch (error) {
    console.error('Error deleting about us image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

