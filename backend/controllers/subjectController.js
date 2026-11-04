

const subjectModel = require("../models/subjectModel");

const SubjectFactory = require("../utils/subjectFactory");

const { validateSubject } = require("../utils/subjectValidation");

// Validate subject ID
const isValidId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// Handle database errors
const handleDatabaseError = (res, error, action) => {
    console.error(`${action} Error:`, error);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "This subject code already exists."
        });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            success: false,
            message: "Invalid class ID."
        });
    }

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            success: false,
            message: "This subject is being used by another record."
        });
    }

    return res.status(500).json({
        success: false,
        message: `Failed to ${action.toLowerCase()}.`
    });
};

// Get all subjects
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await subjectModel.getAllSubjects();

        return res.status(200).json({
            success: true,
            count: subjects.length,
            data: subjects
        });

    } catch (error) {
        return handleDatabaseError(res, error, "Get Subjects");
    }
};

// Get subject by ID
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID."
            });
        }

        const subject = await subjectModel.getSubjectById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: subject
        });

    } catch (error) {
        return handleDatabaseError(res, error, "Get Subject");
    }
};

// Create a new subject
const createSubject = async (req, res) => {
    try {
        // Strategy Pattern: Validate subject data
        const validationError = validateSubject(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Factory Pattern: Create subject object
        const subjectData = SubjectFactory.createSubject(req.body);

        const subjectId = await subjectModel.createSubject(subjectData);

        const subject = await subjectModel.getSubjectById(subjectId);

        return res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            data: subject
        });

    } catch (error) {
        return handleDatabaseError(res, error, "Create Subject");
    }
};

// Update a subject
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID."
            });
        }

        const existingSubject = await subjectModel.getSubjectById(id);

        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        // Strategy Pattern: Validate subject data
        const validationError = validateSubject(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Factory Pattern: Prepare updated subject object
        const subjectData = SubjectFactory.updateSubject(req.body);

        await subjectModel.updateSubject(id, subjectData);

        const updatedSubject = await subjectModel.getSubjectById(id);

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully.",
            data: updatedSubject
        });

    } catch (error) {
        return handleDatabaseError(res, error, "Update Subject");
    }
};

// Delete a subject
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID."
            });
        }

        const existingSubject = await subjectModel.getSubjectById(id);

        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        await subjectModel.deleteSubject(id);

        return res.status(200).json({
            success: true,
            message: "Subject deleted successfully."
        });

    } catch (error) {
        return handleDatabaseError(res, error, "Delete Subject");
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};

