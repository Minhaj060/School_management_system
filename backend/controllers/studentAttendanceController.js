const attendanceModel = require("../models/studentAttendanceModel");

const validId = (id) =>
    /^\d+$/.test(String(id)) && Number(id) > 0;

const validDate = (date) =>
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

const validStatus = (status) =>
    ["present", "absent", "late", "leave"].includes(status);

// Verify current user from database
const verifyUser = async (req, res, allowedRoles) => {
    const user = await attendanceModel.getActiveUser(req.user.user_id);

    if (!user || user.role !== req.user.role) {
        res.status(403).json({
            success: false,
            message: "Account inactive or role changed. Please login again."
        });
        return null;
    }

    if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action."
        });
        return null;
    }

    return user;
};

// Verify teacher assignment
const verifyTeacherAssignment = async (
    userId,
    classId,
    sectionId
) => {
    const teacher = await attendanceModel.getTeacherByUserId(userId);

    if (!teacher || teacher.status !== "active") {
        return false;
    }

    return attendanceModel.isTeacherAssignedToClassSection(
        teacher.teacher_id,
        classId,
        sectionId
    );
};

// Get students and attendance for a class/section/date
const getStudentsByClassSection = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["admin", "teacher"]);
        if (!user) return;

        const { classId, sectionId } = req.params;
        const { date } = req.query;

        if (!validId(classId) || !validId(sectionId) || !validDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Valid class, section and date are required."
            });
        }

        const validSection = await attendanceModel.isValidClassSection(
            Number(classId),
            Number(sectionId)
        );

        if (!validSection) {
            return res.status(400).json({
                success: false,
                message: "Section does not belong to this class."
            });
        }

        if (
            user.role === "teacher" &&
            !(await verifyTeacherAssignment(
                user.user_id,
                Number(classId),
                Number(sectionId)
            ))
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this class and section."
            });
        }

        const [students, attendance] = await Promise.all([
            attendanceModel.getStudentsByClassSection(classId, sectionId),
            attendanceModel.getAttendanceByClassSectionDate(
                classId,
                sectionId,
                date
            )
        ]);

        const attendanceMap = new Map(
            attendance.map((item) => [
                item.student_id,
                {
                    status: item.status,
                    remarks: item.remarks
                }
            ])
        );

        const data = students.map((student) => ({
            ...student,
            attendance: attendanceMap.get(student.student_id) || null
        }));

        return res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Get Student Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student attendance."
        });
    }
};

// Bulk save attendance
const bulkSaveAttendance = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["admin", "teacher"]);
        if (!user) return;

        const { class_id, section_id, attendance_date, attendance } =
            req.body || {};

        if (
            !validId(class_id) ||
            !validId(section_id) ||
            !validDate(attendance_date)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid class, section and attendance date are required."
            });
        }

        if (
            !Array.isArray(attendance) ||
            attendance.length === 0 ||
            attendance.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance must contain 1 to 500 records."
            });
        }

        const validSection = await attendanceModel.isValidClassSection(
            Number(class_id),
            Number(section_id)
        );

        if (!validSection) {
            return res.status(400).json({
                success: false,
                message: "Section does not belong to this class."
            });
        }

        if (
            user.role === "teacher" &&
            !(await verifyTeacherAssignment(
                user.user_id,
                Number(class_id),
                Number(section_id)
            ))
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this class and section."
            });
        }

        const seen = new Set();

        for (const item of attendance) {
            if (
                !item ||
                !validId(item.student_id) ||
                !validStatus(item.status) ||
                (item.remarks !== undefined &&
                    item.remarks !== null &&
                    (typeof item.remarks !== "string" ||
                        item.remarks.length > 255))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student attendance data."
                });
            }

            if (seen.has(Number(item.student_id))) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate student ID in attendance list."
                });
            }

            seen.add(Number(item.student_id));
        }

        const students = await attendanceModel.getStudentsByClassSection(
            Number(class_id),
            Number(section_id)
        );

        const validStudentIds = new Set(
            students.map((student) => student.student_id)
        );

        if (
            attendance.some(
                (item) => !validStudentIds.has(Number(item.student_id))
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more students do not belong to this class/section or are inactive."
            });
        }

     
const attendanceList = attendance.map((item) => ({
    student_id: Number(item.student_id),
    attendance_date: attendance_date,
    status: item.status,
    remarks: item.remarks || null,
    marked_by: user.user_id
}));

        await attendanceModel.bulkSaveAttendance(attendanceList);

        return res.json({
            success: true,
            message: "Student attendance saved successfully.",
            total: attendanceList.length
        });

    } catch (error) {
        console.error("Bulk Save Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save student attendance."
        });
    }
};

// Student: view own attendance
const getMyAttendance = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["student"]);
        if (!user) return;

        const student = await attendanceModel.getStudentByUserId(user.user_id);

        if (!student || student.status !== "active") {
            return res.status(404).json({
                success: false,
                message: "Student profile not found or inactive."
            });
        }

        const { start_date, end_date } = req.query;

        if (!validDate(start_date) || !validDate(end_date) || start_date > end_date) {
            return res.status(400).json({
                success: false,
                message: "Valid start_date and end_date are required."
            });
        }

        const data = await attendanceModel.getStudentAttendanceReport(
            student.student_id,
            start_date,
            end_date
        );

        return res.json({ success: true, data });

    } catch (error) {
        console.error("My Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance."
        });
    }
};

// Parent: view linked child's attendance
const getChildAttendance = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["parent"]);
        if (!user) return;

        const { studentId } = req.params;
        const { start_date, end_date } = req.query;

        if (
            !validId(studentId) ||
            !validDate(start_date) ||
            !validDate(end_date) ||
            start_date > end_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID and date range are required."
            });
        }

        const linked = await attendanceModel.isParentLinkedToStudent(
            user.user_id,
            Number(studentId)
        );

        if (!linked) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this student's attendance."
            });
        }

        const data = await attendanceModel.getStudentAttendanceReport(
            Number(studentId),
            start_date,
            end_date
        );

        return res.json({ success: true, data });

    } catch (error) {
        console.error("Child Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch child attendance."
        });
    }
};

// Admin/Teacher: class attendance report
const getClassAttendanceReport = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["admin", "teacher"]);
        if (!user) return;

        const { class_id, section_id, start_date, end_date } = req.query;

        if (
            !validId(class_id) ||
            !validId(section_id) ||
            !validDate(start_date) ||
            !validDate(end_date) ||
            start_date > end_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid class, section and date range are required."
            });
        }

        if (
            !(await attendanceModel.isValidClassSection(
                Number(class_id),
                Number(section_id)
            ))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid class/section combination."
            });
        }

        if (
            user.role === "teacher" &&
            !(await verifyTeacherAssignment(
                user.user_id,
                Number(class_id),
                Number(section_id)
            ))
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this class and section."
            });
        }

        const data = await attendanceModel.getClassAttendanceReport(
            Number(class_id),
            Number(section_id),
            start_date,
            end_date
        );

        return res.json({ success: true, data });

    } catch (error) {
        console.error("Class Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate attendance report."
        });
    }
};

// Admin/Teacher: search students for individual report
const searchIndividualStudents = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["admin", "teacher"]);
        if (!user) return;

        const { class_id, section_id, search = "" } = req.query;

        if (
            (class_id && !validId(class_id)) ||
            (section_id && !validId(section_id))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid class or section ID."
            });
        }

        if (section_id && !class_id) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required when filtering by section."
            });
        }

        if (search && (typeof search !== "string" || search.length > 100)) {
            return res.status(400).json({
                success: false,
                message: "Search keyword must be within 100 characters."
            });
        }

        if (class_id && section_id) {
            const validSection = await attendanceModel.isValidClassSection(
                Number(class_id),
                Number(section_id)
            );

            if (!validSection) {
                return res.status(400).json({
                    success: false,
                    message: "Section does not belong to this class."
                });
            }
        }

        let teacherId = null;

        if (user.role === "teacher") {
            const teacher = await attendanceModel.getTeacherByUserId(
                user.user_id
            );

            if (!teacher || teacher.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Active teacher profile not found."
                });
            }

            teacherId = teacher.teacher_id;
        }

        const data = await attendanceModel.searchStudentsForIndividualReport({
            classId: class_id ? Number(class_id) : null,
            sectionId: section_id ? Number(section_id) : null,
            search: search.trim(),
            teacherId
        });

        return res.json({
            success: true,
            total: data.length,
            data
        });

    } catch (error) {
        console.error("Search Individual Students Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search students."
        });
    }
};

// Admin/Teacher: get individual student attendance report
const getIndividualStudentReport = async (req, res) => {
    try {
        const user = await verifyUser(req, res, ["admin", "teacher"]);
        if (!user) return;

        const { studentId } = req.params;
        const { start_date, end_date } = req.query;

        if (
            !validId(studentId) ||
            !validDate(start_date) ||
            !validDate(end_date) ||
            start_date > end_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID and date range are required."
            });
        }

        const student = await attendanceModel.getStudentProfileById(
            Number(studentId)
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Active student not found."
            });
        }

        if (
            user.role === "teacher" &&
            !(await verifyTeacherAssignment(
                user.user_id,
                student.class_id,
                student.section_id
            ))
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this student's class and section."
            });
        }

        const data = await attendanceModel.getStudentAttendanceReport(
            Number(studentId),
            start_date,
            end_date
        );

        const summary = {
            total: data.length,
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            attendance_percentage: 0
        };

        data.forEach((record) => {
            if (record.status === "present") summary.present++;
            if (record.status === "absent") summary.absent++;
            if (record.status === "late") summary.late++;
            if (record.status === "leave") summary.leave++;
        });

        if (summary.total > 0) {
            summary.attendance_percentage = Number(
                (
                    ((summary.present + summary.late) / summary.total) *
                    100
                ).toFixed(2)
            );
        }

        return res.json({
            success: true,
            student,
            summary,
            percentage_basis: "Recorded attendance days",
            data
        });

    } catch (error) {
        console.error("Individual Student Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate individual attendance report."
        });
    }
};

module.exports = {
    getStudentsByClassSection,
    bulkSaveAttendance,
    getMyAttendance,
    getChildAttendance,
    getClassAttendanceReport,
    searchIndividualStudents,
    getIndividualStudentReport
};