
const db = require("../config/db");

const dueStrategy = require("../utils/dueCalculationStrategy");
const paymentStrategy = require("../utils/paymentAllocationStrategy");

class AccountsModel {

    // ================= FEE STRUCTURE =================

    async getAllFees() {
        const [rows] = await db.query(`
            SELECT f.*, c.class_name
            FROM fee_structure f
            JOIN classes c ON f.class_id = c.class_id
            ORDER BY f.fee_id DESC
        `);

        return rows;
    }

    async getFeeById(id) {
        const [rows] = await db.query(
            "SELECT * FROM fee_structure WHERE fee_id = ?",
            [id]
        );

        return rows[0];
    }

    async createFee(data) {
        const [result] = await db.query(
            `INSERT INTO fee_structure
            (class_id, fee_name, amount, frequency, description)
            VALUES (?, ?, ?, ?, ?)`,
            [
                data.class_id,
                data.fee_name,
                data.amount,
                data.frequency,
                data.description
            ]
        );

        return this.getFeeById(result.insertId);
    }

    async updateFee(id, data) {
        const [result] = await db.query(
            `UPDATE fee_structure
            SET class_id = ?, fee_name = ?, amount = ?,
                frequency = ?, description = ?
            WHERE fee_id = ?`,
            [
                data.class_id,
                data.fee_name,
                data.amount,
                data.frequency,
                data.description,
                id
            ]
        );

        return result.affectedRows;
    }

    async deleteFee(id) {
        const [result] = await db.query(
            "DELETE FROM fee_structure WHERE fee_id = ?",
            [id]
        );

        return result.affectedRows;
    }


    // ================= STUDENT FEE ASSIGNMENT =================

    async assignFee(data) {
        const [students] = await db.query(
            "SELECT class_id FROM students WHERE student_id = ?",
            [data.student_id]
        );

        if (!students.length) {
            throw new Error("Student not found.");
        }

        const [fees] = await db.query(
            "SELECT class_id, amount FROM fee_structure WHERE fee_id = ?",
            [data.fee_id]
        );

        if (!fees.length) {
            throw new Error("Fee structure not found.");
        }

        if (Number(students[0].class_id) !== Number(fees[0].class_id)) {
            throw new Error("Fee structure does not belong to this student's class.");
        }

        const [result] = await db.query(
            `INSERT INTO student_fees
            (student_id, fee_id, due_amount, paid_amount, due_date, status)
            VALUES (?, ?, ?, 0, ?, 'unpaid')`,
            [
                data.student_id,
                data.fee_id,
                fees[0].amount,
                data.due_date || null
            ]
        );

        return result.insertId;
    }

    async getStudentFees(studentId) {
        const [rows] = await db.query(
            `SELECT sf.*, f.fee_name, f.frequency,
                    s.full_name,
                    GREATEST(sf.due_amount - sf.paid_amount, 0) AS outstanding
             FROM student_fees sf
             JOIN fee_structure f ON sf.fee_id = f.fee_id
             JOIN students s ON sf.student_id = s.student_id
             WHERE sf.student_id = ?
             ORDER BY sf.student_fee_id DESC`,
            [studentId]
        );

        return rows;
    }
    // Get all student fee records
async getAllStudentFees() {
    const [rows] = await db.query(`
        SELECT
            sf.student_fee_id,
            sf.student_id,
            s.full_name,
            sf.fee_id,
            fs.fee_name,
            fs.frequency,
            sf.due_amount,
            sf.paid_amount,
            (sf.due_amount - sf.paid_amount) AS outstanding,
            sf.due_date,
            sf.status
        FROM student_fees sf
        JOIN students s ON sf.student_id = s.student_id
        JOIN fee_structure fs ON sf.fee_id = fs.fee_id
        ORDER BY sf.student_fee_id DESC
    `);

    return rows;
}


    // ================= DUE CALCULATION =================

    async getAllDues(studentId = null) {
        let sql = `
            SELECT sf.student_fee_id, sf.student_id,
                   s.full_name, s.student_code,
                   f.fee_name, sf.due_amount, sf.paid_amount,
                   sf.due_date, sf.status,
                   GREATEST(sf.due_amount - sf.paid_amount, 0) AS outstanding
            FROM student_fees sf
            JOIN students s ON sf.student_id = s.student_id
            JOIN fee_structure f ON sf.fee_id = f.fee_id
            WHERE sf.due_amount > sf.paid_amount
        `;

        const params = [];

        if (studentId) {
            sql += " AND sf.student_id = ?";
            params.push(studentId);
        }

        sql += " ORDER BY sf.due_date ASC";

        const [rows] = await db.query(sql, params);

        return rows.map(row => ({
            ...row,
            outstanding: dueStrategy.calculate(
                row.due_amount,
                row.paid_amount
            )
        }));
    }


    // ================= STUDENT PAYMENT =================

    async createPayment(data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [fees] = await connection.query(
                `SELECT * FROM student_fees
                 WHERE student_fee_id = ? AND student_id = ?
                 FOR UPDATE`,
                [data.student_fee_id, data.student_id]
            );

            if (!fees.length) {
                throw new Error("Student fee record not found.");
            }

            const fee = fees[0];

            const allocation = paymentStrategy.calculate(
                fee.due_amount,
                fee.paid_amount,
                data.amount
            );

            const [result] = await connection.query(
                `INSERT INTO payments
                (student_id, student_fee_id, amount,
                 payment_method, transaction_number, received_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.student_id,
                    data.student_fee_id,
                    Number(data.amount),
                    data.payment_method || "cash",
                    data.transaction_number || null,
                    data.received_by || null
                ]
            );

            await connection.query(
                `UPDATE student_fees
                 SET paid_amount = ?, status = ?
                 WHERE student_fee_id = ?`,
                [
                    allocation.paid_amount,
                    allocation.status,
                    data.student_fee_id
                ]
            );

            await connection.commit();

            return {
                payment_id: result.insertId,
                paid_amount: allocation.paid_amount,
                status: allocation.status
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getPaymentHistory(studentId = null) {
        let sql = `
            SELECT p.*, s.full_name, s.student_code,
                   f.fee_name, u.full_name AS received_by_name
            FROM payments p
            JOIN students s ON p.student_id = s.student_id
            LEFT JOIN student_fees sf
                ON p.student_fee_id = sf.student_fee_id
            LEFT JOIN fee_structure f ON sf.fee_id = f.fee_id
            LEFT JOIN users u ON p.received_by = u.user_id
        `;

        const params = [];

        if (studentId) {
            sql += " WHERE p.student_id = ?";
            params.push(studentId);
        }

        sql += " ORDER BY p.payment_date DESC";

        const [rows] = await db.query(sql, params);

        return rows;
    }


    // ================= INCOME =================

    async getAllIncome() {
        const [rows] = await db.query(
            "SELECT * FROM income ORDER BY income_date DESC"
        );

        return rows;
    }

    async createIncome(data) {
        const [result] = await db.query(
            `INSERT INTO income
            (source, amount, income_date, description, created_by)
            VALUES (?, ?, ?, ?, ?)`,
            [
                data.source,
                data.amount,
                data.income_date,
                data.description,
                data.created_by
            ]
        );

        return result.insertId;
    }

    async updateIncome(id, data) {
        const [result] = await db.query(
            `UPDATE income
             SET source = ?, amount = ?, income_date = ?, description = ?
             WHERE income_id = ?`,
            [
                data.source,
                data.amount,
                data.income_date,
                data.description,
                id
            ]
        );

        return result.affectedRows;
    }

    async deleteIncome(id) {
        const [result] = await db.query(
            "DELETE FROM income WHERE income_id = ?",
            [id]
        );

        return result.affectedRows;
    }


    // ================= EXPENSE =================

    async getAllExpenses() {
        const [rows] = await db.query(
            "SELECT * FROM expenses ORDER BY expense_date DESC"
        );

        return rows;
    }

    async createExpense(data) {
        const [result] = await db.query(
            `INSERT INTO expenses
            (category, amount, expense_date, description, created_by)
            VALUES (?, ?, ?, ?, ?)`,
            [
                data.category,
                data.amount,
                data.expense_date,
                data.description,
                data.created_by
            ]
        );

        return result.insertId;
    }

    async updateExpense(id, data) {
        const [result] = await db.query(
            `UPDATE expenses
             SET category = ?, amount = ?, expense_date = ?, description = ?
             WHERE expense_id = ?`,
            [
                data.category,
                data.amount,
                data.expense_date,
                data.description,
                id
            ]
        );

        return result.affectedRows;
    }

    async deleteExpense(id) {
        const [result] = await db.query(
            "DELETE FROM expenses WHERE expense_id = ?",
            [id]
        );

        return result.affectedRows;
    }


    // ================= SALARY AND PAYSLIPS =================

    async getSalaryByUser(userId) {
        const [rows] = await db.query(
            `SELECT u.user_id, u.full_name,
                    COALESCE(t.salary, st.salary) AS basic_salary
             FROM users u
             LEFT JOIN teachers t ON u.user_id = t.user_id
             LEFT JOIN staff st ON u.user_id = st.user_id
             WHERE u.user_id = ?`,
            [userId]
        );

        return rows[0];
    }

    async checkPayslipExists(userId, salaryMonth) {
        const [rows] = await db.query(
            `SELECT payslip_id FROM payslips
             WHERE user_id = ? AND salary_month = ?`,
            [userId, salaryMonth]
        );

        return rows.length > 0;
    }

    async createPayslip(data) {
        const [result] = await db.query(
            `INSERT INTO payslips
            (user_id, salary_month, basic_salary, allowance,
             deduction, net_salary, payment_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.user_id,
                data.salary_month,
                data.basic_salary,
                data.allowance,
                data.deduction,
                data.net_salary,
                data.payment_date,
                data.status
            ]
        );

        return result.insertId;
    }

    async getAllPayslips() {
        const [rows] = await db.query(
            `SELECT p.*, u.full_name, u.email
             FROM payslips p
             JOIN users u ON p.user_id = u.user_id
             ORDER BY p.payslip_id DESC`
        );

        return rows;
    }

    async getPayslipById(id) {
        const [rows] = await db.query(
            `SELECT p.*, u.full_name, u.email
             FROM payslips p
             JOIN users u ON p.user_id = u.user_id
             WHERE p.payslip_id = ?`,
            [id]
        );

        return rows[0];
    }

    async markPayslipPaid(id, paymentDate) {
        const [result] = await db.query(
            `UPDATE payslips
             SET status = 'paid', payment_date = ?
             WHERE payslip_id = ? AND status = 'generated'`,
            [paymentDate, id]
        );

        return result.affectedRows;
    }
    // Get student ID using the logged-in user's ID
async getStudentIdByUserId(userId) {
    const [rows] = await db.query(
        `SELECT student_id
         FROM students
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0]?.student_id || null;
}
}

module.exports = new AccountsModel();
