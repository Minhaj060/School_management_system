
const db = require("../config/db");

// Get all assignments
const getAllAssignments = async () => {
    const [rows] = await db.query(`
        SELECT
            ts.assignment_id,
            ts.teacher_id,
            ts.subject_id,
            ts.class_id,
            ts.section_id,
            t.employee_code,
            t.full_name AS teacher_name,
            s.subject_name,
            c.class_name,
            sec.section_name
        FROM teacher_subjects ts
        JOIN teachers t ON ts.teacher_id = t.teacher_id
        JOIN subjects s ON ts.subject_id = s.subject_id
        LEFT JOIN classes c ON ts.class_id = c.class_id
        LEFT JOIN sections sec ON ts.section_id = sec.section_id
        ORDER BY ts.assignment_id DESC
    `);

    return rows;
};

// Check duplicate assignment
const isDuplicateAssignment = async (
    teacher_id,
    subject_id,
    class_id,
    section_id,
    excludeId = null
) => {
    let query = `
        SELECT assignment_id
        FROM teacher_subjects
        WHERE teacher_id = ?
          AND subject_id = ?
          AND class_id = ?
          AND section_id = ?
    `;

    const params = [
        teacher_id,
        subject_id,
        class_id,
        section_id
    ];

    if (excludeId !== null) {
        query += " AND assignment_id != ?";
        params.push(excludeId);
    }

    const [rows] = await db.query(query, params);

    return rows.length > 0;
};

// Create assignment
const createAssignment = async (data) => {
    const { teacher_id, subject_id, class_id, section_id } = data;

    const duplicate = await isDuplicateAssignment(
        teacher_id,
        subject_id,
        class_id,
        section_id
    );

    if (duplicate) {
        const error = new Error(
            "This teacher is already assigned to this subject, class and section."
        );
        error.statusCode = 409;
        throw error;
    }

    const [result] = await db.query(
        `INSERT INTO teacher_subjects
        (teacher_id, subject_id, class_id, section_id)
        VALUES (?, ?, ?, ?)`,
        [teacher_id, subject_id, class_id, section_id]
    );

    return result.insertId;
};

// Get assignment by ID
const getAssignmentById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM teacher_subjects WHERE assignment_id = ?",
        [id]
    );

    return rows[0];
};

// Update assignment
const updateAssignment = async (id, data) => {
    const { teacher_id, subject_id, class_id, section_id } = data;

    const duplicate = await isDuplicateAssignment(
        teacher_id,
        subject_id,
        class_id,
        section_id,
        id
    );

    if (duplicate) {
        const error = new Error(
            "This teacher is already assigned to this subject, class and section."
        );
        error.statusCode = 409;
        throw error;
    }

    const [result] = await db.query(
        `UPDATE teacher_subjects
         SET teacher_id = ?, subject_id = ?, class_id = ?, section_id = ?
         WHERE assignment_id = ?`,
        [teacher_id, subject_id, class_id, section_id, id]
    );

    return result.affectedRows;
};

// Delete assignment
const deleteAssignment = async (id) => {
    const [result] = await db.query(
        "DELETE FROM teacher_subjects WHERE assignment_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllAssignments,
    createAssignment,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
};
