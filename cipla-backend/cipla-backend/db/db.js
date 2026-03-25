const mysql = require('mysql2');

// ✅ Create pool with proper config
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test connection
const testConnection = async () => {
  try {
    const [rows] = await pool.promise().query("SELECT NOW()");
    console.log("✅ Database connected at:", rows[0]["NOW()"]);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);
  }
};

testConnection();

// ✅ Export promise pool
module.exports = pool.promise();