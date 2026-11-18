
const db = require("../config/db");

// Get active students by class and section
const getStudentsByClassSection = async (classId, sectionId) => {
    const [rows] = await db.query(
        `SELECT student_id, student_code, full_name,
                roll_number, class_id, section_id
         FROM students
         WHERE class_id = ? AND section_id = ?
           AND status = 'active'
         ORDER BY roll_number ASC, full_name ASC`,
        [classId, sectionId]
    );
    return rows;
};

// Get attendance by class, section and date
const getAttendanceByClassSectionDate = async (
    classId, sectionId, date
) => {
    const [rows] = await db.query(
        `SELECT sa.attendance_id, sa.student_id,
                s.student_code, s.full_name, s.roll_number,
                sa.attendance_date, sa.status, sa.remarks,
                sa.marked_by
         FROM student_attendance sa
         INNER JOIN students s ON sa.student_id = s.student_id
         WHERE s.class_id = ? AND s.section_id = ?
           AND sa.attendance_date = ?
         ORDER BY s.roll_number ASC`,
        [classId, sectionId, date]
    );
    return rows;
};

// Verify class and section relationship
const isValidClassSection = async (classId, sectionId) => {
    const [rows] = await db.query(
        `SELECT section_id FROM sections
         WHERE section_id = ? AND class_id = ?`,
        [sectionId, classId]
    );
    return rows.length > 0;
};

// Verify teacher assignment
const isTeacherAssignedToClassSection = async (
    teacherId, classId, sectionId
) => {
    const [rows] = await db.query(
        `SELECT 1 FROM teacher_subjects
         WHERE teacher_id = ? AND class_id = ?
           AND section_id = ? LIMIT 1`,
        [teacherId, classId, sectionId]
    );
    return rows.length > 0;
};

// Get teacher profile by logged-in user ID
const getTeacherByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT teacher_id, user_id, status
         FROM teachers WHERE user_id = ? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
};

// Get student profile by logged-in user ID
const getStudentByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT student_id, user_id, status
         FROM students WHERE user_id = ? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
};

// Verify parent-child relationship
const isParentLinkedToStudent = async (parentUserId, studentId) => {
    const [rows] = await db.query(
        `SELECT id FROM parent_students
         WHERE parent_user_id = ? AND student_id = ? LIMIT 1`,
        [parentUserId, studentId]
    );
    return rows.length > 0;
};

// Get current active user
const getActiveUser = async (userId) => {
    const [rows] = await db.query(
        `SELECT user_id, role, status FROM users
         WHERE user_id = ? AND status = 'active' LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
};

// Bulk save attendance using transaction
const bulkSaveAttendance = async (attendanceList) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const attendance of attendanceList) {
            await connection.query(
                `INSERT INTO student_attendance
                    (student_id, attendance_date, status, remarks, marked_by)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    remarks = VALUES(remarks),
                    marked_by = VALUES(marked_by)`,
                [
                    attendance.student_id,
                    attendance.attendance_date,
                    attendance.status,
                    attendance.remarks || null,
                    attendance.marked_by || null
                ]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Create single attendance
const createAttendance = async (attendance) => {
    const [result] = await db.query(
        `INSERT INTO student_attendance
            (student_id, attendance_date, status, remarks, marked_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
            attendance.student_id,
            attendance.attendance_date,
            attendance.status,
            attendance.remarks || null,
            attendance.marked_by || null
        ]
    );
    return result.insertId;
};

// Update single attendance
const updateAttendance = async (id, attendance) => {
    const [result] = await db.query(
        `UPDATE student_attendance
         SET status = ?, remarks = ?, marked_by = ?
         WHERE attendance_id = ?`,
        [
            attendance.status,
            attendance.remarks || null,
            attendance.marked_by || null,
            id
        ]
    );
    return result.affectedRows;
};

// Get attendance report for a student
const getStudentAttendanceReport = async (
    studentId, startDate, endDate
) => {
    const [rows] = await db.query(
        `SELECT attendance_id, student_id, attendance_date,
                status, remarks, marked_by
         FROM student_attendance
         WHERE student_id = ?
           AND attendance_date BETWEEN ? AND ?
         ORDER BY attendance_date DESC`,
        [studentId, startDate, endDate]
    );
    return rows;
};

// Get attendance report for all students in a class/section
const getClassAttendanceReport = async (
    classId, sectionId, startDate, endDate
) => {
    const [rows] = await db.query(
        `SELECT sa.attendance_id, sa.student_id,
                s.student_code, s.full_name, s.roll_number,
                sa.attendance_date, sa.status, sa.remarks,
                sa.marked_by
         FROM student_attendance sa
         INNER JOIN students s ON sa.student_id = s.student_id
         WHERE s.class_id = ? AND s.section_id = ?
           AND sa.attendance_date BETWEEN ? AND ?
         ORDER BY sa.attendance_date DESC, s.roll_number ASC`,
        [classId, sectionId, startDate, endDate]
    );
    return rows;
};

// Search students for individual attendance report
const searchStudentsForIndividualReport = async ({
    classId, sectionId, search, teacherId
}) => {
    let sql = `
        SELECT s.student_id, s.student_code, s.full_name,
               s.roll_number, s.class_id, s.section_id
        FROM students s
        WHERE s.status = 'active'
    `;
    const params = [];

    if (classId) {
        sql += ` AND s.class_id = ?`;
        params.push(classId);
    }

    if (sectionId) {
        sql += ` AND s.section_id = ?`;
        params.push(sectionId);
    }

    if (search) {
        sql += ` AND (
            s.full_name LIKE ?
            OR s.student_code LIKE ?
            OR CAST(s.roll_number AS CHAR) LIKE ?
        )`;
        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword);
    }

    if (teacherId) {
        sql += ` AND EXISTS (
            SELECT 1 FROM teacher_subjects ts
            WHERE ts.teacher_id = ?
              AND ts.class_id = s.class_id
              AND ts.section_id = s.section_id
        )`;
        params.push(teacherId);
    }

    sql += `
        ORDER BY s.class_id ASC, s.section_id ASC,
                 s.roll_number ASC, s.full_name ASC
        LIMIT 100
    `;

    const [rows] = await db.query(sql, params);
    return rows;
};

// Get one active student profile by student ID
const getStudentProfileById = async (studentId) => {
    const [rows] = await db.query(
        `SELECT student_id, student_code, full_name,
                roll_number, class_id, section_id, status
         FROM students
         WHERE student_id = ? AND status = 'active'
         LIMIT 1`,
        [studentId]
    );
    return rows[0] || null;
};

module.exports = {
    getStudentsByClassSection,
    getAttendanceByClassSectionDate,
    isValidClassSection,
    isTeacherAssignedToClassSection,
    getTeacherByUserId,
    getStudentByUserId,
    isParentLinkedToStudent,
    getActiveUser,
    bulkSaveAttendance,
    createAttendance,
    updateAttendance,
    getStudentAttendanceReport,
    getClassAttendanceReport,
    searchStudentsForIndividualReport,
    getStudentProfileById
};
