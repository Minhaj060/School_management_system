
const express = require("express");
const router = express.Router();

const {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// GET all subjects
router.get(
    "/",
    authenticateToken,
    authorizePermission("subjects:read"),
    getAllSubjects
);

// GET subject by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("subjects:read"),
    getSubjectById
);

// CREATE subject
router.post(
    "/",
    authenticateToken,
    authorizePermission("subjects:create"),
    createSubject
);

// UPDATE subject
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("subjects:update"),
    updateSubject
);

// DELETE subject
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("subjects:delete"),
    deleteSubject
);

module.exports = router;
