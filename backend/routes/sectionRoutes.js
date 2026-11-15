
const express = require("express");

const router = express.Router();

const {
    getAllSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection
} = require("../controllers/sectionController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

// Protect all section routes
router.use(authenticateToken, authorizeRoles("admin"));

// GET all sections
router.get("/", getAllSections);

// GET section by ID
router.get("/:id", getSectionById);

// CREATE section
router.post("/", createSection);

// UPDATE section
router.put("/:id", updateSection);

// DELETE section
router.delete("/:id", deleteSection);

module.exports = router;
