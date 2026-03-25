const pool = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    let connection;

    try {
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and Password are required",
            });
        }

        connection = await pool.getConnection();

        const [users] = await connection.query(
            "SELECT * FROM user WHERE username = ?",
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        const userData = users[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            userData.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }

        // ✅ create token
        const token = jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                role: userData.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // ✅ SAFE USER DATA (IMPORTANT)
        const safeUser = {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            full_name: userData.full_name,
        };

        return res.status(200).json({
            message: "Login successful",
            token,
            user: safeUser,
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    } finally {
        if (connection) connection.release();
    }
};