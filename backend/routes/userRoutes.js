
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// Get all users
router.get(
    "/",
    authenticateToken,
    authorizePermission("users:read"),
    userController.getAllUsers
);

// Get user by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("users:read"),
    userController.getUserById
);

// Create user
router.post(
    "/",
    authenticateToken,
    authorizePermission("users:create"),
    userController.createUser
);

// Update user
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("users:update"),
    userController.updateUser
);

// Delete user
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("users:delete"),
    userController.deleteUser
);

module.exports = router;
