const db = require("../config/db");

// Get all teachers
const getAllTeachers = async () => {
    const [rows] = await db.query(
        "SELECT * FROM teachers ORDER BY teacher_id DESC"
    );
    return rows;
};

// Get teacher by ID
const getTeacherById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM teachers WHERE teacher_id = ?",
        [id]
    );
    return rows[0];
};

// Create new teacher
const createTeacher = async (teacher) => {
    const {
        user_id = null,
        employee_code,
        full_name,
        gender = null,
        phone = null,
        email = null,
        address = null,
        joining_date = null,
        designation = null,
        salary = null,
        status = "active"
    } = teacher;

    const [result] = await db.query(
        `INSERT INTO teachers
        (user_id, employee_code, full_name, gender, phone, email,
         address, joining_date, designation, salary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            employee_code,
            full_name,
            gender,
            phone,
            email,
            address,
            joining_date,
            designation,
            salary,
            status
        ]
    );

    return result.insertId;
};

// Update teacher
const updateTeacher = async (id, teacher) => {
    const allowedFields = [
        "user_id",
        "employee_code",
        "full_name",
        "gender",
        "phone",
        "email",
        "address",
        "joining_date",
        "designation",
        "salary",
        "status"
    ];

    const fields = Object.keys(teacher).filter(
        (field) => allowedFields.includes(field)
    );

    if (fields.length === 0) {
        return 0;
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => teacher[field]);

    const [result] = await db.query(
        `UPDATE teachers SET ${setClause} WHERE teacher_id = ?`,
        [...values, id]
    );

    return result.affectedRows;
};

// Delete teacher
const deleteTeacher = async (id) => {
    const [result] = await db.query(
        "DELETE FROM teachers WHERE teacher_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};