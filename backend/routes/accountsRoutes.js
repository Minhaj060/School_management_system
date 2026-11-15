
const express = require("express");
const router = express.Router();

const {
    getAllFees,
    getFeeById,
    createFee,
    updateFee,
    deleteFee,

    assignFee,
    getStudentFees,

    getAllDues,

    createPayment,
    getPaymentHistory,

    getAllIncome,
    createIncome,
    updateIncome,
    deleteIncome,

    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,

    createPayslip,
    getAllPayslips,
    getPayslipById,
    markPayslipPaid
} = require("../controllers/accountsController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// All Accounts APIs require authentication
router.use(authenticateToken);

// FEE STRUCTURE
router.get(
    "/fee-structures",
    authorizePermission("fees:read"),
    getAllFees
);

router.get(
    "/fee-structures/:id",
    authorizePermission("fees:read"),
    getFeeById
);

router.post(
    "/fee-structures",
    authorizePermission("fees:create"),
    createFee
);

router.put(
    "/fee-structures/:id",
    authorizePermission("fees:update"),
    updateFee
);

router.delete(
    "/fee-structures/:id",
    authorizePermission("fees:delete"),
    deleteFee
);

// STUDENT FEES
router.post(
    "/student-fees",
    authorizePermission("student-fees:create"),
    assignFee
);

router.get(
    "/student-fees/:studentId",
    authorizePermission("student-fees:read"),
    getStudentFees
);

// DUES
router.get(
    "/dues",
    authorizePermission("dues:read"),
    getAllDues
);

// PAYMENTS
router.post(
    "/payments",
    authorizePermission("payments:create"),
    createPayment
);

router.get(
    "/payments",
    authorizePermission("payments:read"),
    getPaymentHistory
);

// INCOME
router.get(
    "/income",
    authorizePermission("income:read"),
    getAllIncome
);

router.post(
    "/income",
    authorizePermission("income:create"),
    createIncome
);

router.put(
    "/income/:id",
    authorizePermission("income:update"),
    updateIncome
);

router.delete(
    "/income/:id",
    authorizePermission("income:delete"),
    deleteIncome
);

// EXPENSES
router.get(
    "/expenses",
    authorizePermission("expenses:read"),
    getAllExpenses
);

router.post(
    "/expenses",
    authorizePermission("expenses:create"),
    createExpense
);

router.put(
    "/expenses/:id",
    authorizePermission("expenses:update"),
    updateExpense
);

router.delete(
    "/expenses/:id",
    authorizePermission("expenses:delete"),
    deleteExpense
);

// PAYSLIPS
router.get(
    "/payslips",
    authorizePermission("payslips:read"),
    getAllPayslips
);

router.get(
    "/payslips/:id",
    authorizePermission("payslips:read"),
    getPayslipById
);

router.post(
    "/payslips",
    authorizePermission("payslips:create"),
    createPayslip
);

router.put(
    "/payslips/:id/pay",
    authorizePermission("payslips:pay"),
    markPayslipPaid
);

module.exports = router;
