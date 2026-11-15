
const express = require("express");
const router = express.Router();

const teacherController = require("../controllers/teacherController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// Get all teachers
router.get(
    "/",
    authenticateToken,
    authorizePermission("teachers:read"),
    teacherController.getAllTeachers
);

// Get teacher by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("teachers:read"),
    teacherController.getTeacherById
);

// Create teacher
router.post(
    "/",
    authenticateToken,
    authorizePermission("teachers:create"),
    teacherController.createTeacher
);

// Update teacher
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("teachers:update"),
    teacherController.updateTeacher
);

// Delete teacher
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("teachers:delete"),
    teacherController.deleteTeacher
);

module.exports = router;
