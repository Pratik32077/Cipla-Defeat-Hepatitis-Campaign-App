const bcrypt = require('bcryptjs');
const pool = require('../db/db');

async function registerUser({ username, password, role, full_name, location, emp_code }) {
  const connection = await pool.getConnection();
  try {
    const [existingUser] = await connection.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return { status: 409, message: 'Username already exists' };
    }

    const [result] = await connection.query(
      'INSERT INTO user (username, password_hash, role,location ,full_name, emp_code) VALUES (?, ?,?, ?, ?, ?)',
      [username, password, role,location, full_name, emp_code]
    );

    return { status: 201, message: 'User registered', userId: result.insertId };
  } catch (err) {
    console.error('Register error:', err);
    return { status: 500, message: 'Error during registration' };
  } finally {
    connection.release();
  }
}

module.exports = { registerUser };
