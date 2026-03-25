require('dotenv').config();
const pool = require('./db/db');

async function test() {
  try {
    const [user] = await pool.query('SELECT id FROM user WHERE username = "ritesh"');
    if (user.length === 0) return console.log("User ritesh not found.");
    const userId = user[0].id;

    await pool.query('INSERT INTO doctor (full_name, specialization, city, added_by, contact) VALUES (?, ?, ?, ?, ?)', 
      ['Dr. Strange', 'Surgeon', 'New York', userId, '1234567890']);
    console.log("✅ Added dummy doctor for ritesh");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

test();
