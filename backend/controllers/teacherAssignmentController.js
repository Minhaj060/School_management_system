
const model = require("../models/teacherAssignmentModel");

// Get all assignments
const getAllAssignments = async (req, res) => {
    try {
        const data = await model.getAllAssignments();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create assignment
const createAssignment = async (req, res) => {
    try {
        const {
            teacher_id,
            subject_id,
            class_id,
            section_id
        } = req.body;

        if (
            !teacher_id ||
            !subject_id ||
            !class_id ||
            !section_id
        ) {
            return res.status(400).json({
                success: false,
                message: "Teacher, Subject, Class and Section are required."
            });
        }

        const ids = [
            teacher_id,
            subject_id,
            class_id,
            section_id
        ];

        if (!ids.every(id =>
            Number.isInteger(Number(id)) && Number(id) > 0
        )) {
            return res.status(400).json({
                success: false,
                message: "All assignment IDs must be valid positive numbers."
            });
        }

        const assignmentId = await model.createAssignment({
            teacher_id: Number(teacher_id),
            subject_id: Number(subject_id),
            class_id: Number(class_id),
            section_id: Number(section_id)
        });

        res.status(201).json({
            success: true,
            message: "Teacher assigned successfully.",
            assignment_id: assignmentId
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update assignment
const updateAssignment = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment ID."
            });
        }

        const existing = await model.getAssignmentById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found."
            });
        }

        const {
            teacher_id,
            subject_id,
            class_id,
            section_id
        } = req.body;

        if (
            !teacher_id ||
            !subject_id ||
            !class_id ||
            !section_id
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const ids = [
            teacher_id,
            subject_id,
            class_id,
            section_id
        ];

        if (!ids.every(value =>
            Number.isInteger(Number(value)) && Number(value) > 0
        )) {
            return res.status(400).json({
                success: false,
                message: "All assignment IDs must be valid positive numbers."
            });
        }

        await model.updateAssignment(id, {
            teacher_id: Number(teacher_id),
            subject_id: Number(subject_id),
            class_id: Number(class_id),
            section_id: Number(section_id)
        });

        res.json({
            success: true,
            message: "Assignment updated successfully."
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
    try {
        const deleted = await model.deleteAssignment(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found."
            });
        }

        res.json({
            success: true,
            message: "Assignment deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
};
