const pool = require("../db/db");

// ✅ ADD DOCTOR
exports.addDoctor = async (req, res) => {
    const { id } = req.user;
    const { doctorName, specialization, notes, city, contact } = req.body;

    let connection;

    try {
        if (!doctorName || !specialization) {
            return res.status(400).json({
                message: "Doctor name and specialization are required",
            });
        }

        connection = await pool.getConnection();

        const [count] = await connection.query(
            `SELECT COUNT(*) AS total FROM doctor WHERE added_by = ?`,
            [id]
        );

        if (count[0].total >= 50) {
            return res.status(409).json({
                message: "Limit reached: Max 50 doctors",
            });
        }

        const [result] = await connection.query(
            `INSERT INTO doctor (full_name, specialization, notes, city, added_by, contact) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                doctorName.trim(),
                specialization.trim(),
                notes || "",
                city || "",
                id,
                contact || "",
            ]
        );

        return res.status(201).json({
            message: "Doctor added successfully",
            doctorId: result.insertId,
        });

    } catch (error) {
        console.error("Error adding doctor:", error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ GET ALL DOCTORS + VIDEOS
exports.getAllDoctor = async (req, res) => {
    const { id } = req.user;
    let connection;

    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            `SELECT
        v.id AS video_id,
        v.title AS video_title,
        v.processed_filename AS video_file,
        v.capture_image AS image_file,
        v.created_at AS createdAt,

        d.id AS doctor_id,
        d.full_name AS doctor_fullName,
        d.specialization,
        d.city,
        d.contact

      FROM video v
      JOIN doctor d ON v.doctor_id = d.id
      WHERE v.uploaded_by = ?`,
            [id]
        );

        return res.status(200).json({
            message: "Data fetched successfully",
            data: rows,
        });

    } catch (error) {
        console.error("Error fetching doctors:", error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ TOTAL DOCTORS (BY LOGGED-IN MANAGER)
exports.totalDoctors = async (req, res) => {
    const { id } = req.user;
    let connection;

    try {
        connection = await pool.getConnection();

        const [result] = await connection.query(
            `SELECT COUNT(*) AS totalDoctors FROM doctor WHERE added_by = ?`,
            [id]
        );

        return res.status(200).json({
            message: "Total doctors fetched successfully",
            totalDoctors: result[0].totalDoctors,
        });

    } catch (error) {
        console.error("Error fetching total doctors:", error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ TOTAL DOCTORS BY EMP CODE
exports.totalDoctorsByManager = async (req, res) => {
    const { emp_code } = req.query;
    let connection;

    try {
        if (!emp_code) {
            return res.status(400).json({
                message: "Emp Code is required",
            });
        }

        connection = await pool.getConnection();

        const [row] = await connection.query(
            `SELECT id FROM user WHERE emp_code = ?`,
            [emp_code]
        );

        if (row.length === 0) {
            return res.status(404).json({
                message: "Manager not found",
            });
        }

        const userId = row[0].id;

        const [result] = await connection.query(
            `SELECT
        d.id AS doctor_id,
        d.full_name AS doctor_full_name,
        d.specialization,
        d.contact,
        d.city,
        JSON_OBJECT(
          'video_id', v.id,
          'video_file', v.processed_filename,
          'image_file', v.capture_image
        ) AS video_details
      FROM doctor d
      LEFT JOIN video v ON d.id = v.doctor_id
      WHERE d.added_by = ?`,
            [userId]
        );

        return res.status(200).json({
            message: "success",
            result,
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: error.message,
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ TOTAL VIDEOS
exports.totalVideos = async (req, res) => {
    const { id } = req.user;
    let connection;

    try {
        connection = await pool.getConnection();

        const [result] = await connection.query(
            `SELECT COUNT(*) AS totalVideos FROM video WHERE uploaded_by = ?`,
            [id]
        );

        return res.status(200).json({
            message: "All videos",
            totalVideos: result[0].totalVideos,
        });

    } catch (error) {
        console.error("Error fetching videos:", error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ UPDATE DOWNLOAD COUNT
exports.totalDownloadCount = async (req, res) => {
    const { id } = req.user;
    const { videoId, downloadCount } = req.body;
    let connection;

    try {
        if (!id || !videoId || downloadCount === undefined) {
            return res.status(400).json({
                message: "User ID, Video ID, and Download Count are required",
            });
        }

        connection = await pool.getConnection();

        const [result] = await connection.query(
            `UPDATE video SET download_count = ? WHERE id = ? AND uploaded_by = ?`,
            [downloadCount, videoId, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "No matching video found",
            });
        }

        return res.status(200).json({
            message: "Download count updated successfully",
        });

    } catch (error) {
        console.error("Download count error:", error.message);
        return res.status(500).json({
            message: error.message,
        });
    } finally {
        if (connection) connection.release();
    }
};