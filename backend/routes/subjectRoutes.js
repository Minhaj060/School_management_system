
const express = require("express");
const router = express.Router();

const {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

// GET all subjects
router.get("/", getAllSubjects);

// GET a subject by ID
router.get("/:id", getSubjectById);

// CREATE a subject
router.post("/", createSubject);

// UPDATE a subject
router.put("/:id", updateSubject);

// DELETE a subject
router.delete("/:id", deleteSubject);

module.exports = router;
