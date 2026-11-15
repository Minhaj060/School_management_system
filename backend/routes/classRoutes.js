
const express = require("express");

const {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} = require("../controllers/classController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all classes
router.get(
    "/",
    authenticateToken,
    authorizePermission("classes:read"),
    getAllClasses
);

// Get class by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("classes:read"),
    getClassById
);

// Create class
router.post(
    "/",
    authenticateToken,
    authorizePermission("classes:create"),
    createClass
);

// Update class
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("classes:update"),
    updateClass
);

// Delete class
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("classes:delete"),
    deleteClass
);

module.exports = router;
