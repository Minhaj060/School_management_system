
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
    authorizeRoles
} = require("../middleware/authMiddleware");

// Protect all subject routes
router.use(authenticateToken, authorizeRoles("admin"));

// GET all subjects
router.get("/", getAllSubjects);

// GET subject by ID
router.get("/:id", getSubjectById);

// CREATE subject
router.post("/", createSubject);

// UPDATE subject
router.put("/:id", updateSubject);

// DELETE subject
router.delete("/:id", deleteSubject);

module.exports = router;
