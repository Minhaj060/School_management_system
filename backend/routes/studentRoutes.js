
const express = require("express");

const {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all students
router.get(
    "/",
    authenticateToken,
    authorizePermission("students:read"),
    getAllStudents
);

// Get student by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("students:read"),
    getStudentById
);

// Create student
router.post(
    "/",
    authenticateToken,
    authorizePermission("students:create"),
    createStudent
);

// Update student
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("students:update"),
    updateStudent
);

// Delete student
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("students:delete"),
    deleteStudent
);

module.exports = router;
