const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const upload = require('../config/upload');

// utilitaires: normaliser les entrées
function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}
function toTinyIntBool(value) {
  // accepte true/false, "true"/"false", 1/"1"/0/"0"
  if (value === true || value === 1 || value === '1' || value === 'true') return 1;
  if (value === false || value === 0 || value === '0' || value === 'false') return 0;
  // par défaut actif
  return 1;
}

// GET /api/admin/banners?active=true|false
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    let query = 'SELECT * FROM banners';
    const params = [];

    if (active !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(toTinyIntBool(active));
    }

    query += ' ORDER BY sort_order ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/banners/:id
router.get('/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/banners  (upload field name: image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const imageUrl = `/uploads/banners/${req.file.filename}`;
    const sortOrder = toInt(req.body.sortOrder, 0);
    const isActive = toTinyIntBool(req.body.isActive);

    const [result] = await pool.query(
      'INSERT INTO banners (image_url, sort_order, is_active) VALUES (?, ?, ?)',
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
    console.error('Error creating banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/banners/:id
router.put('/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const sortOrder = toInt(req.body.sortOrder, 0);
    const isActive = toTinyIntBool(req.body.isActive);

    const [result] = await pool.query(
      'UPDATE banners SET sort_order = ?, is_active = ? WHERE id = ?',
      [sortOrder, isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, data: { id, sort_order: sortOrder, is_active: isActive } });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

