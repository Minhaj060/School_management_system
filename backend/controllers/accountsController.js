const AccountsModel = require("../models/accountsModel");

const feeFactory = require("../utils/feeFactory");
const accountFactory = require("../utils/accountFactory");
const salaryFactory = require("../utils/salaryFactory");

const validId = id => /^\d+$/.test(String(id)) && Number(id) > 0;

const validAmount = amount =>
    amount !== undefined &&
    amount !== null &&
    amount !== "" &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0;

const sendError = (res, error) => {
    const message = error.message || "Something went wrong.";

    if (
        message.includes("not found") ||
        message.includes("does not belong")
    ) {
        return res.status(400).json({
            success: false,
            message
        });
    }

    if (
        message.includes("Payment amount") ||
        message.includes("Payment cannot") ||
        message.includes("Deduction cannot") ||
        message.includes("Salary values")
    ) {
        return res.status(400).json({
            success: false,
            message
        });
    }

    console.error(error);

    return res.status(500).json({
        success: false,
        message: "Server error."
    });
};


// ================= FEE STRUCTURE =================

exports.getAllFees = async (req, res) => {
    try {
        const data = await AccountsModel.getAllFees();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getFeeById = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid fee ID."
            });
        }

        const data = await AccountsModel.getFeeById(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Fee structure not found."
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createFee = async (req, res) => {
    try {
        const { class_id, fee_name, amount, frequency } = req.body;

        if (
            !validId(class_id) ||
            !fee_name?.trim() ||
            !validAmount(amount) ||
            !["monthly", "yearly", "one_time"].includes(frequency || "monthly")
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid fee information."
            });
        }

        const data = feeFactory.createFee(req.body);
        const result = await AccountsModel.createFee(data);

        res.status(201).json({
            success: true,
            message: "Fee structure created successfully.",
            data: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.updateFee = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid fee ID."
            });
        }

        const { class_id, fee_name, amount, frequency } = req.body;

        if (
            !validId(class_id) ||
            !fee_name?.trim() ||
            !validAmount(amount) ||
            !["monthly", "yearly", "one_time"].includes(frequency || "monthly")
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid fee information."
            });
        }

        const data = feeFactory.createFee(req.body);
        const result = await AccountsModel.updateFee(req.params.id, data);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Fee structure not found."
            });
        }

        res.json({
            success: true,
            message: "Fee structure updated successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteFee = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid fee ID."
            });
        }

        const result = await AccountsModel.deleteFee(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Fee structure not found."
            });
        }

        res.json({
            success: true,
            message: "Fee structure deleted successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= STUDENT FEES =================

exports.assignFee = async (req, res) => {
    try {
        const { student_id, fee_id } = req.body;

        if (!validId(student_id) || !validId(fee_id)) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID and fee ID are required."
            });
        }

        const result = await AccountsModel.assignFee(req.body);

        res.status(201).json({
            success: true,
            message: "Fee assigned to student successfully.",
            student_fee_id: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getStudentFees = async (req, res) => {
    try {
        if (!validId(req.params.studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const data = await AccountsModel.getStudentFees(
            req.params.studentId
        );

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= DUES =================

exports.getAllDues = async (req, res) => {
    try {
        const studentId = req.query.student_id || null;

        if (studentId && !validId(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const data = await AccountsModel.getAllDues(studentId);

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= PAYMENTS =================

exports.createPayment = async (req, res) => {
    try {
        const {
            student_id,
            student_fee_id,
            amount,
            payment_method
        } = req.body;

        const methods = ["cash", "bkash", "nagad", "bank", "card"];

        if (
            !validId(student_id) ||
            !validId(student_fee_id) ||
            !validAmount(amount) ||
            !methods.includes(payment_method || "cash")
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid payment information."
            });
        }

        const result = await AccountsModel.createPayment(req.body);

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully.",
            data: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const studentId = req.query.student_id || null;

        if (studentId && !validId(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const data = await AccountsModel.getPaymentHistory(studentId);

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= INCOME =================

exports.getAllIncome = async (req, res) => {
    try {
        const data = await AccountsModel.getAllIncome();

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createIncome = async (req, res) => {
    try {
        const { source, amount, income_date } = req.body;

        if (!source?.trim() || !validAmount(amount) || !income_date) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid income information."
            });
        }

        const data = accountFactory.createIncome(req.body);
        const result = await AccountsModel.createIncome(data);

        res.status(201).json({
            success: true,
            message: "Income recorded successfully.",
            income_id: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.updateIncome = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid income ID."
            });
        }

        const { source, amount, income_date } = req.body;

        if (!source?.trim() || !validAmount(amount) || !income_date) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid income information."
            });
        }

        const data = accountFactory.createIncome(req.body);
        const result = await AccountsModel.updateIncome(req.params.id, data);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Income record not found."
            });
        }

        res.json({
            success: true,
            message: "Income updated successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid income ID."
            });
        }

        const result = await AccountsModel.deleteIncome(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Income record not found."
            });
        }

        res.json({
            success: true,
            message: "Income deleted successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= EXPENSE =================

exports.getAllExpenses = async (req, res) => {
    try {
        const data = await AccountsModel.getAllExpenses();

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { category, amount, expense_date } = req.body;

        if (!category?.trim() || !validAmount(amount) || !expense_date) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid expense information."
            });
        }

        const data = accountFactory.createExpense(req.body);
        const result = await AccountsModel.createExpense(data);

        res.status(201).json({
            success: true,
            message: "Expense recorded successfully.",
            expense_id: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.updateExpense = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID."
            });
        }

        const { category, amount, expense_date } = req.body;

        if (!category?.trim() || !validAmount(amount) || !expense_date) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid expense information."
            });
        }

        const data = accountFactory.createExpense(req.body);
        const result = await AccountsModel.updateExpense(req.params.id, data);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Expense record not found."
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID."
            });
        }

        const result = await AccountsModel.deleteExpense(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Expense record not found."
            });
        }

        res.json({
            success: true,
            message: "Expense deleted successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};


// ================= PAYSLIPS =================

exports.createPayslip = async (req, res) => {
    try {
        const { user_id, salary_month, allowance, deduction } = req.body;

        if (!validId(user_id) || !salary_month?.trim()) {
            return res.status(400).json({
                success: false,
                message: "User ID and salary month are required."
            });
        }

        const employee = await AccountsModel.getSalaryByUser(user_id);

        if (!employee || employee.basic_salary === null) {
            return res.status(404).json({
                success: false,
                message: "Employee salary information not found."
            });
        }

        const exists = await AccountsModel.checkPayslipExists(
            user_id,
            salary_month
        );

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "A payslip already exists for this employee and month."
            });
        }

        const payslipData = salaryFactory.createPayslip({
            ...req.body,
            basic_salary: employee.basic_salary
        });

        const result = await AccountsModel.createPayslip(payslipData);

        res.status(201).json({
            success: true,
            message: "Payslip generated successfully.",
            payslip_id: result
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getAllPayslips = async (req, res) => {
    try {
        const data = await AccountsModel.getAllPayslips();

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getPayslipById = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payslip ID."
            });
        }

        const data = await AccountsModel.getPayslipById(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Payslip not found."
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        sendError(res, error);
    }
};

exports.markPayslipPaid = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payslip ID."
            });
        }

        const paymentDate = req.body.payment_date;

        if (!paymentDate) {
            return res.status(400).json({
                success: false,
                message: "Payment date is required."
            });
        }

        const result = await AccountsModel.markPayslipPaid(
            req.params.id,
            paymentDate
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Generated payslip not found."
            });
        }

        res.json({
            success: true,
            message: "Payslip marked as paid."
        });
    } catch (error) {
        sendError(res, error);
    }
};