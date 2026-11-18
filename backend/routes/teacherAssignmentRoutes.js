
const express = require("express");
const router = express.Router();

const controller = require("../controllers/teacherAssignmentController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

router.get(
    "/",
    authenticateToken,
    authorizePermission("teachers:read"),
    controller.getAllAssignments
);

router.post(
    "/",
    authenticateToken,
    authorizePermission("teachers:create"),
    controller.createAssignment
);

router.put(
    "/:id",
    authenticateToken,
    authorizePermission("teachers:update"),
    controller.updateAssignment
);

router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("teachers:delete"),
    controller.deleteAssignment
);

module.exports = router;
