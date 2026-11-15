
const express = require("express");
const router = express.Router();

const teacherController = require("../controllers/teacherController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

// Protect all teacher routes
router.use(authenticateToken, authorizeRoles("admin"));

// Get all teachers
router.get("/", teacherController.getAllTeachers);

// Get teacher by ID
router.get("/:id", teacherController.getTeacherById);

// Create teacher
router.post("/", teacherController.createTeacher);

// Update teacher
router.put("/:id", teacherController.updateTeacher);

// Delete teacher
router.delete("/:id", teacherController.deleteTeacher);

module.exports = router;
