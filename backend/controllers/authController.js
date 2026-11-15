const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Login Controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user by email
        const [users] = await db.query(
            `SELECT user_id, full_name, email, password, role, status
             FROM users
             WHERE email = ?`,
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        // Check account status
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Contact administrator."
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
},
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        // Send response
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    login
};