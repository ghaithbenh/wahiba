const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { pool } = require('./config/database');

// Configuration
const SANITY_BACKUP_PATH = path.join(__dirname, '../backend-sanity/new-backup/production-export-2025-09-26t11-28-43-649z');
const DATA_FILE = path.join(SANITY_BACKUP_PATH, 'data.ndjson');
const IMAGES_DIR = path.join(SANITY_BACKUP_PATH, 'images');
const TARGET_IMAGES_DIR = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(TARGET_IMAGES_DIR)) {
  fs.mkdirSync(TARGET_IMAGES_DIR, { recursive: true });
}

// Data storage
const data = {
  categories: [],
  dresses: [],
  schedules: [],
  contacts: [],
  revenues: [],
  banners: [],
  aboutUsImages: []
};

// Helper: Copy image file and return new URL
function copyImage(sanityAssetPath) {
  if (!sanityAssetPath) return null;
  
  // Extract filename from path like: image@file://./images/filename.jpg
  const match = sanityAssetPath.match(/images\/(.+)$/);
  if (!match) return null;
  
  const filename = match[1];
  const sourcePath = path.join(IMAGES_DIR, filename);
  const targetPath = path.join(TARGET_IMAGES_DIR, filename);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      return `/uploads/${filename}`;
    }
  } catch (error) {
    console.error(`Error copying image ${filename}:`, error.message);
  }
  
  return null;
}

// Parse NDJSON file
async function parseData() {
  console.log('📖 Reading Sanity backup data...\n');
  
  const fileStream = fs.createReadStream(DATA_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const doc = JSON.parse(line);
      
      // Skip drafts and system docs
      if (doc._id.startsWith('drafts.') || doc._id.startsWith('_')) {
        continue;
      }
      
      switch (doc._type) {
        case 'category':
          data.categories.push(doc);
          break;
        case 'dress':
          data.dresses.push(doc);
          break;
        case 'schedules':
          data.schedules.push(doc);
          break;
        case 'contact':
          data.contacts.push(doc);
          break;
        case 'revenues':
          data.revenues.push(doc);
          break;
        case 'banner':
          data.banners.push(doc);
          break;
        case 'aboutUs':
          data.aboutUsImages.push(doc);
          break;
      }
    } catch (error) {
      console.error('Error parsing line:', error.message);
    }
  }
  
  console.log(`✅ Found ${data.categories.length} categories`);
  console.log(`✅ Found ${data.dresses.length} dresses`);
  console.log(`✅ Found ${data.schedules.length} schedules`);
  console.log(`✅ Found ${data.contacts.length} contacts`);
  console.log(`✅ Found ${data.revenues.length} revenues`);
  console.log(`✅ Found ${data.banners.length} banners`);
  console.log(`✅ Found ${data.aboutUsImages.length} about-us images\n`);
}

// Insert data into MySQL
async function insertData() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Insert Categories
    console.log('📦 Inserting categories...');
    const categoryMap = new Map(); // Sanity ID -> MySQL ID
    
    for (const cat of data.categories) {
      const [result] = await connection.query(
        'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
        [cat.name]
      );
      categoryMap.set(cat._id, result.insertId);
      console.log(`  ✓ ${cat.name}`);
    }
    
    // 2. Insert Dresses with Colors and Images
    console.log('\n👗 Inserting dresses...');
    
    for (const dress of data.dresses) {
      try {
        // Insert dress
        const [dressResult] = await connection.query(
          `INSERT INTO dresses (
            name, description, new_collection, price_per_day, is_rent_on_discount,
            new_price_per_day, is_for_sale, buy_price, is_sell_on_discount,
            new_buy_price, sizes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
          [
            dress.name,
            dress.description || null,
            dress.newCollection || false,
            dress.pricePerDay || null,
            dress.isRentOnDiscount || false,
            dress.newPricePerDay || null,
            dress.isForSale || false,
            dress.buyPrice || null,
            dress.isSellOnDiscount || false,
            dress.newBuyPrice || null,
            JSON.stringify(dress.sizes || [])
          ]
        );
        
        const dressId = dressResult.insertId;
        console.log(`  ✓ ${dress.name} (ID: ${dressId})`);
        
        // Insert dress categories
        if (dress.categories && dress.categories.length > 0) {
          for (const catRef of dress.categories) {
            const mysqlCatId = categoryMap.get(catRef._ref);
            if (mysqlCatId) {
              await connection.query(
                'INSERT IGNORE INTO dress_categories (dress_id, category_id) VALUES (?, ?)',
                [dressId, mysqlCatId]
              );
            }
          }
        }
        
        // Insert colors and images
        if (dress.colors && dress.colors.length > 0) {
          for (const color of dress.colors) {
            const [colorResult] = await connection.query(
              'INSERT INTO dress_colors (dress_id, color_name) VALUES (?, ?)',
              [dressId, color.name]
            );
            
            const colorId = colorResult.insertId;
            
            // Insert images
            if (color.images && color.images.length > 0) {
              for (let i = 0; i < color.images.length; i++) {
                const img = color.images[i];
                const imageUrl = copyImage(img._sanityAsset);
                
                if (imageUrl) {
                  await connection.query(
                    'INSERT INTO dress_images (dress_color_id, image_url, sort_order) VALUES (?, ?, ?)',
                    [colorId, imageUrl, i]
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`  ✗ Error inserting dress ${dress.name}:`, error.message);
      }
    }
    
    // 3. Insert Schedules
    console.log('\n📅 Inserting schedules...');
    
    for (const schedule of data.schedules) {
      try {
        const [scheduleResult] = await connection.query(
          `INSERT INTO schedules (
            full_name, phone, address, note, try_on_date, status, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            schedule.fullName,
            schedule.phone,
            schedule.address || null,
            schedule.note || null,
            schedule.tryOnDate || null,
            schedule.status || 'pending',
            schedule.total || 0
          ]
        );
        
        const scheduleId = scheduleResult.insertId;
        
        // Insert schedule items
        if (schedule.items && schedule.items.length > 0) {
          for (const item of schedule.items) {
            await connection.query(
              `INSERT INTO schedule_items (
                schedule_id, dress_name, color, size, quantity,
                start_date, end_date, price_per_day, buy_price, type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                scheduleId,
                item.dressName,
                item.color || null,
                item.size || null,
                item.quantity || 1,
                item.startDate || null,
                item.endDate || null,
                item.pricePerDay || null,
                item.buyPrice || null,
                item.type || 'quote'
              ]
            );
          }
        }
        
        console.log(`  ✓ Schedule for ${schedule.fullName}`);
      } catch (error) {
        console.error(`  ✗ Error inserting schedule:`, error.message);
      }
    }
    
    // 4. Insert Contacts
    console.log('\n📧 Inserting contacts...');
    
    for (const contact of data.contacts) {
      try {
        await connection.query(
          `INSERT INTO contacts (name, email, phone, subject, message) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            contact.name,
            contact.email,
            contact.phone || null,
            contact.subject || null,
            contact.message || null
          ]
        );
        console.log(`  ✓ ${contact.name}`);
      } catch (error) {
        console.error(`  ✗ Error inserting contact:`, error.message);
      }
    }
    
    // 5. Insert Revenues
    console.log('\n💰 Inserting revenues...');
    
    for (const revenue of data.revenues) {
      try {
        await connection.query(
          `INSERT INTO revenues (
            month, total_sales, sales_revenue, total_rental, rental_revenue
          ) VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_sales = VALUES(total_sales),
            sales_revenue = VALUES(sales_revenue),
            total_rental = VALUES(total_rental),
            rental_revenue = VALUES(rental_revenue)`,
          [
            revenue.month,
            revenue.totalSales || 0,
            revenue.salesRevenue || 0,
            revenue.totalRental || 0,
            revenue.rentalRevenue || 0
          ]
        );
        console.log(`  ✓ ${revenue.month}`);
      } catch (error) {
        console.error(`  ✗ Error inserting revenue:`, error.message);
      }
    }
    
    // 6. Insert Banners
    console.log('\n🖼️  Inserting banners...');
    
    for (let i = 0; i < data.banners.length; i++) {
      const banner = data.banners[i];
      try {
        let imageUrl = null;
        
        if (banner.image && banner.image.asset) {
          imageUrl = copyImage(banner.image.asset._sanityAsset || banner.image._sanityAsset);
        }
        
        if (imageUrl) {
          await connection.query(
            'INSERT INTO banners (image_url, sort_order, is_active) VALUES (?, ?, ?)',
            [imageUrl, banner.sortOrder || i, banner.isActive !== false]
          );
          console.log(`  ✓ Banner ${i + 1}`);
        }
      } catch (error) {
        console.error(`  ✗ Error inserting banner:`, error.message);
      }
    }
    
    // 7. Insert About Us Images
    console.log('\n🎨 Inserting about-us images...');
    
    for (let i = 0; i < data.aboutUsImages.length; i++) {
      const aboutImg = data.aboutUsImages[i];
      try {
        let imageUrl = null;
        
        if (aboutImg.image && aboutImg.image.asset) {
          imageUrl = copyImage(aboutImg.image.asset._sanityAsset || aboutImg.image._sanityAsset);
        }
        
        if (imageUrl) {
          await connection.query(
            'INSERT INTO about_us_images (image_url, sort_order, is_active) VALUES (?, ?, ?)',
            [imageUrl, aboutImg.sortOrder || i, aboutImg.isActive !== false]
          );
          console.log(`  ✓ About-us image ${i + 1}`);
        }
      } catch (error) {
        console.error(`  ✗ Error inserting about-us image:`, error.message);
      }
    }
    
    await connection.commit();
    console.log('\n✅ All data inserted successfully!\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error inserting data:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Sanity to MySQL migration...\n');
    
    // Parse data
    await parseData();
    
    // Insert into MySQL
    await insertData();
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

main();


