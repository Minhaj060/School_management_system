const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Login
router.post("/login", login);

// Get logged-in user
router.get("/me", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

module.exports = router;