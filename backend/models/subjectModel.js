

const db = require("../config/db");

// Get all subjects
const getAllSubjects = async () => {
    const [rows] = await db.query(`
        SELECT subject_id, subject_name, subject_code, class_id
        FROM subjects
        ORDER BY subject_id DESC
    `);

    return rows;
};

// Get a subject by ID
const getSubjectById = async (id) => {
    const [rows] = await db.query(
        `SELECT subject_id, subject_name, subject_code, class_id
         FROM subjects
         WHERE subject_id = ?`,
        [id]
    );

    return rows[0];
};

// Create a new subject
const createSubject = async (subject) => {
    const { subject_name, subject_code, class_id } = subject;

    const [result] = await db.query(
        `INSERT INTO subjects
         (subject_name, subject_code, class_id)
         VALUES (?, ?, ?)`,
        [subject_name, subject_code, class_id]
    );

    return result.insertId;
};

// Update an existing subject
const updateSubject = async (id, subject) => {
    const { subject_name, subject_code, class_id } = subject;

    const [result] = await db.query(
        `UPDATE subjects
         SET subject_name = ?, subject_code = ?, class_id = ?
         WHERE subject_id = ?`,
        [subject_name, subject_code, class_id, id]
    );

    return result.affectedRows;
};

// Delete a subject
const deleteSubject = async (id) => {
    const [result] = await db.query(
        "DELETE FROM subjects WHERE subject_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
