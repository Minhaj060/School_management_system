const teacherModel = require("../models/teacherModel");

// Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel.getAllTeachers();

        res.status(200).json({
            success: true,
            data: teachers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherModel.getTeacherById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create teacher
const createTeacher = async (req, res) => {
    try {
        const { employee_code, full_name } = req.body;

        if (!employee_code || !full_name) {
            return res.status(400).json({
                success: false,
                message: "Employee code and full name are required"
            });
        }

        const teacherId = await teacherModel.createTeacher(req.body);

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            teacher_id: teacherId
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update teacher
const updateTeacher = async (req, res) => {
    try {
        const teacher = await teacherModel.getTeacherById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const affectedRows = await teacherModel.updateTeacher(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: affectedRows > 0
                ? "Teacher updated successfully"
                : "No changes made"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
    try {
        const affectedRows = await teacherModel.deleteTeacher(req.params.id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};