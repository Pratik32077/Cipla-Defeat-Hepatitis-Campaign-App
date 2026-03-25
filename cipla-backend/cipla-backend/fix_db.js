require('dotenv').config();
const pool = require('./db/db');

async function fix() {
  try {
    const columnsToAdd = [
      'title VARCHAR(255)',
      'original_filename VARCHAR(255)',
      'file_size BIGINT',
      'duration FLOAT',
      'status VARCHAR(50)',
      'processing_progress INT DEFAULT 0',
      'download_count INT DEFAULT 0',
      'processed_at TIMESTAMP NULL',
      'capture_type VARCHAR(50)'
    ];

    for (const colDef of columnsToAdd) {
      const colName = colDef.split(' ')[0];
      try {
        await pool.query(`ALTER TABLE video ADD COLUMN ${colDef}`);
        console.log(`✅ Added ${colName}`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`⚠️ ${colName} already exists`);
        } else {
          console.error(`❌ Error adding ${colName}:`, err.message);
        }
      }
    }
    console.log("Database schema fix complete.");
  } catch (error) {
    console.error("General Error:", error);
  } finally {
    process.exit();
  }
}

fix();
