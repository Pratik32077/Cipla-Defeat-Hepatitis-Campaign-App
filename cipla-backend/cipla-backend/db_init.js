const pool = require('./db/db');

async function createTables() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log("Creating 'user' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        emp_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating 'doctor' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS doctor (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        city VARCHAR(255),
        contact VARCHAR(50),
        added_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by) REFERENCES user(id) ON DELETE SET NULL
      )
    `);

    console.log("Creating 'video' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS video (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT,
        processed_filename VARCHAR(255),
        capture_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE
      )
    `);

    console.log("Successfully created/verified tables.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

createTables();
