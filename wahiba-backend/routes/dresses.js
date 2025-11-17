const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');
const upload = require('../config/upload');

/* ---------- helpers ---------- */
function parseSizes(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    // Essayer JSON d'abord
    try {
      const j = JSON.parse(value);
      if (Array.isArray(j)) return j;
    } catch { /* pas du JSON, continuer */ }

    // Sinon, traiter comme CSV / single token
    return value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
}

function mapColorRow(row) {
  return {
    id: row.id,
    dressId: row.dress_id,
    colorName: row.color_name,
    // images mappées séparément
  };
}

function mapImageRow(row) {
  return {
    id: row.id,
    dressColorId: row.dress_color_id,
    imageUrl: row.image_url,       // <- camelCase pour le front
    sortOrder: row.sort_order
  };
}

function mapCategoryRow(row) {
  return { id: row.id, name: row.name };
}

function mapDressRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    newCollection: !!row.new_collection,
    pricePerDay: row.price_per_day !== null ? Number(row.price_per_day) : null,
    isRentOnDiscount: !!row.is_rent_on_discount,
    newPricePerDay: row.new_price_per_day !== null ? Number(row.new_price_per_day) : null,
    isForSale: !!row.is_for_sale,
    buyPrice: row.buy_price !== null ? Number(row.buy_price) : null,
    isSellOnDiscount: !!row.is_sell_on_discount,
    newBuyPrice: row.new_buy_price !== null ? Number(row.new_buy_price) : null,
    sizes: parseSizes(row.sizes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // categories, colors ajoutées ensuite
  };
}
/* -------------------------------- */

/* Get all dresses with categories, colors and images */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dresses ORDER BY created_at DESC');

    const dresses = [];
    for (const r of rows) {
      const dress = mapDressRow(r);

      // Categories
      const [categories] = await pool.query(`
        SELECT c.id, c.name
        FROM categories c
        INNER JOIN dress_categories dc ON c.id = dc.category_id
        WHERE dc.dress_id = ?
      `, [r.id]);
      dress.categories = categories.map(mapCategoryRow);

      // Colors
      const [colorsRows] = await pool.query('SELECT * FROM dress_colors WHERE dress_id = ?', [r.id]);
      const colors = [];
      for (const c of colorsRows) {
        const color = mapColorRow(c);
        const [imagesRows] = await pool.query(
          'SELECT * FROM dress_images WHERE dress_color_id = ? ORDER BY sort_order ASC',
          [c.id]
        );
        color.images = imagesRows.map(mapImageRow);
        colors.push(color);
      }
      dress.colors = colors;

      dresses.push(dress);
    }

    res.json({ success: true, data: dresses });
  } catch (error) {
    console.error('Error fetching dresses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Get dress by ID (with categories, colors, images) */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dresses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dress not found' });
    }

    const r = rows[0];
    const dress = mapDressRow(r);

    const [categories] = await pool.query(`
      SELECT c.id, c.name
      FROM categories c
      INNER JOIN dress_categories dc ON c.id = dc.category_id
      WHERE dc.dress_id = ?
    `, [r.id]);
    dress.categories = categories.map(mapCategoryRow);

    const [colorsRows] = await pool.query('SELECT * FROM dress_colors WHERE dress_id = ?', [r.id]);
    const colors = [];
    for (const c of colorsRows) {
      const color = mapColorRow(c);
      const [imagesRows] = await pool.query(
        'SELECT * FROM dress_images WHERE dress_color_id = ? ORDER BY sort_order ASC',
        [c.id]
      );
      color.images = imagesRows.map(mapImageRow);
      colors.push(color);
    }
    dress.colors = colors;

    res.json({ success: true, data: dress });
  } catch (error) {
    console.error('Error fetching dress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Create dress */
router.post('/',
  body('name').notEmpty().trim(),
  body('description').optional(),
  body('pricePerDay').optional().isNumeric(),
  body('buyPrice').optional().isNumeric(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        name,
        description,
        newCollection,
        pricePerDay,
        isRentOnDiscount,
        newPricePerDay,
        isForSale,
        buyPrice,
        isSellOnDiscount,
        newBuyPrice,
        sizes,
        categoryIds
      } = req.body;

      // Unicité du nom
      const [existing] = await connection.query('SELECT id FROM dresses WHERE name = ?', [name]);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, error: 'Dress with this name already exists' });
      }

      const [dressResult] = await connection.query(`
        INSERT INTO dresses (
          name, description, new_collection, price_per_day, is_rent_on_discount,
          new_price_per_day, is_for_sale, buy_price, is_sell_on_discount, new_buy_price, sizes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        description || null,
        !!newCollection,
        pricePerDay ?? null,
        !!isRentOnDiscount,
        newPricePerDay ?? null,
        !!isForSale,
        buyPrice ?? null,
        !!isSellOnDiscount,
        newBuyPrice ?? null,
        sizes ? JSON.stringify(Array.isArray(sizes) ? sizes : parseSizes(sizes)) : null
      ]);

      const dressId = dressResult.insertId;

      if (categoryIds && Array.isArray(categoryIds)) {
        for (const categoryId of categoryIds) {
          await connection.query(
            'INSERT INTO dress_categories (dress_id, category_id) VALUES (?, ?)',
            [dressId, categoryId]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ success: true, data: { id: dressId, name } });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating dress:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      connection.release();
    }
  }
);

/* Update dress */
router.put('/:id',
  body('name').notEmpty().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const {
        name,
        description,
        newCollection,
        pricePerDay,
        isRentOnDiscount,
        newPricePerDay,
        isForSale,
        buyPrice,
        isSellOnDiscount,
        newBuyPrice,
        sizes,
        categoryIds
      } = req.body;

      const [existing] = await connection.query('SELECT id FROM dresses WHERE id = ?', [id]);
      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: 'Dress not found' });
      }

      const [dup] = await connection.query(
        'SELECT id FROM dresses WHERE name = ? AND id != ?',
        [name, id]
      );
      if (dup.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, error: 'Dress with this name already exists' });
      }

      await connection.query(`
        UPDATE dresses SET
          name = ?, description = ?, new_collection = ?, price_per_day = ?,
          is_rent_on_discount = ?, new_price_per_day = ?, is_for_sale = ?,
          buy_price = ?, is_sell_on_discount = ?, new_buy_price = ?, sizes = ?
        WHERE id = ?
      `, [
        name,
        description || null,
        !!newCollection,
        pricePerDay ?? null,
        !!isRentOnDiscount,
        newPricePerDay ?? null,
        !!isForSale,
        buyPrice ?? null,
        !!isSellOnDiscount,
        newBuyPrice ?? null,
        sizes ? JSON.stringify(Array.isArray(sizes) ? sizes : parseSizes(sizes)) : null,
        id
      ]);

      if (categoryIds && Array.isArray(categoryIds)) {
        await connection.query('DELETE FROM dress_categories WHERE dress_id = ?', [id]);
        for (const categoryId of categoryIds) {
          await connection.query(
            'INSERT INTO dress_categories (dress_id, category_id) VALUES (?, ?)',
            [id, categoryId]
          );
        }
      }

      await connection.commit();
      res.json({ success: true, data: { id: Number(id), name } });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating dress:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      connection.release();
    }
  }
);

/* Delete dress */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM dresses WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Dress not found' });
    }
    res.json({ success: true, message: 'Dress deleted successfully' });
  } catch (error) {
    console.error('Error deleting dress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Add color to dress */
router.post('/:id/colors',
  body('colorName').notEmpty().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { colorName } = req.body;
      const [result] = await pool.query(
        'INSERT INTO dress_colors (dress_id, color_name) VALUES (?, ?)',
        [id, colorName]
      );
      res.status(201).json({
        success: true,
        data: { id: result.insertId, dressId: Number(id), colorName }
      });
    } catch (error) {
      console.error('Error adding color:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/* Upload images for a color */
router.post('/colors/:colorId/images', upload.array('images', 10), async (req, res) => {
  try {
    const { colorId } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No images uploaded' });
    }

    const out = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `/uploads/dresses/${file.filename}`;
      const [result] = await pool.query(
        'INSERT INTO dress_images (dress_color_id, image_url, sort_order) VALUES (?, ?, ?)',
        [colorId, imageUrl, i]
      );
      out.push({ id: result.insertId, dressColorId: Number(colorId), imageUrl, sortOrder: i });
    }

    res.status(201).json({ success: true, data: out });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Delete color */
router.delete('/colors/:colorId', async (req, res) => {
  try {
    const { colorId } = req.params;
    const [result] = await pool.query('DELETE FROM dress_colors WHERE id = ?', [colorId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Color not found' });
    }
    res.json({ success: true, message: 'Color deleted successfully' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Delete image */
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const [result] = await pool.query('DELETE FROM dress_images WHERE id = ?', [imageId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
