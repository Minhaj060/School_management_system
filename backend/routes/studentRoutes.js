
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
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all student routes
router.use(authenticateToken, authorizeRoles("admin"));

// Get all students
router.get("/", getAllStudents);

// Get student by ID
router.get("/:id", getStudentById);

// Create student
router.post("/", createStudent);

// Update student
router.put("/:id", updateStudent);

// Delete student
router.delete("/:id", deleteStudent);

module.exports = router;
