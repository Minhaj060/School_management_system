const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/studentAttendanceController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// Admin/Teacher: Load students and existing attendance
router.get(
    "/classes/:classId/sections/:sectionId/students",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.getStudentsByClassSection
);

// Admin/Teacher: Bulk save attendance
router.post(
    "/bulk",
    authenticateToken,
    authorizePermission("attendance:create"),
    attendanceController.bulkSaveAttendance
);

// Student: Own attendance
router.get(
    "/my",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.getMyAttendance
);

// Parent: Linked child's attendance
router.get(
    "/children/:studentId",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.getChildAttendance
);

// Admin/Teacher: Class attendance report
router.get(
    "/report",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.getClassAttendanceReport
);

// Admin/Teacher: Search students for individual report
// Keep this route before /individual/:studentId
router.get(
    "/individual/students",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.searchIndividualStudents
);

// Admin/Teacher: Individual student attendance report
router.get(
    "/individual/:studentId",
    authenticateToken,
    authorizePermission("attendance:read"),
    attendanceController.getIndividualStudentReport
);

module.exports = router;