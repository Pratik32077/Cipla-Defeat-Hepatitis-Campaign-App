const pool = require('../db/db');
const bcrypt = require("bcryptjs");

// ✅ ADD ADMIN (SECURE)
exports.addAdmin = async (req, res) => {
  const { username, full_name, password } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({
      message: 'All fields are required',
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [existingUsers] = await connection.query(
      "SELECT * FROM user WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      `INSERT INTO user (username, password_hash, role, full_name) 
       VALUES (?, ?, ?, ?)`,
      [username, hashedPassword, "admin", full_name] // 🔥 force admin
    );

    return res.status(201).json({
      message: "Admin added successfully"
    });

  } catch (error) {
    console.error('Admin Error:', error.message);
    return res.status(500).json({
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ GET MANAGER INFO (FIXED)
exports.getManagerInfo = async (req, res) => {
  const { managerName } = req.query;
  let connection;

  try {
    if (!managerName) {
      return res.status(400).json({
        message: "Manager name is required"
      });
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      `SELECT * FROM user WHERE full_name = ?`,
      [managerName]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    return res.status(200).json({
      message: 'Manager details',
      response: result[0]
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ TOTAL MANAGERS LIST
exports.totalManagersList = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT
        u.id AS manager_id,
        u.full_name AS fullName,
        u.emp_code AS Emp_Code,
        u.location AS Location,
        COUNT(d.id) AS total_doctor_added
      FROM user u
      LEFT JOIN doctor d ON u.id = d.added_by
      GROUP BY u.id
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("Managers Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ TOTAL DOCTORS
exports.totalDoctorAdded = async (req, res) => {
  const { date } = req.query;
  let connection;

  if (!date) {
    return res.status(400).json({
      message: 'Date is required.'
    });
  }

  try {
    connection = await pool.getConnection();

    const [result] = await connection.query(
      `SELECT COUNT(*) AS total_doctors
       FROM doctor
       WHERE DATE(created_at) = ?`,
      [date]
    );

    res.status(200).json({
      total_doctors: result[0].total_doctors
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ TOTAL VIDEOS
exports.totalVideoRecorded = async (req, res) => {
  const { date } = req.query;
  let connection;

  try {
    if (!date) {
      return res.status(400).json({
        message: 'Date is required'
      });
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT COUNT(*) AS videoCount
       FROM video
       WHERE DATE(created_at) = ?`,
      [date]
    );

    return res.status(200).json({
      count: rows[0].videoCount
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ DOCTOR LIST WITH VIDEO
exports.getTotalDoctorsList = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [results] = await connection.query(`
      SELECT
        d.id AS doctor_id,
        d.full_name,
        d.specialization,
        d.city,
        d.contact,
        d.added_by AS manager_id,
        v.processed_filename,
        v.capture_image
      FROM doctor d
      LEFT JOIN video v ON d.id = v.doctor_id
    `);

    return res.status(200).json({
      results
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};