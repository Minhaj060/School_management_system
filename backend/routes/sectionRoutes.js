
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
    authorizePermission
} = require("../middleware/authMiddleware");

// GET all sections
router.get(
    "/",
    authenticateToken,
    authorizePermission("sections:read"),
    getAllSections
);

// GET section by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("sections:read"),
    getSectionById
);

// CREATE section
router.post(
    "/",
    authenticateToken,
    authorizePermission("sections:create"),
    createSection
);

// UPDATE section
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("sections:update"),
    updateSection
);

// DELETE section
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("sections:delete"),
    deleteSection
);

module.exports = router;
