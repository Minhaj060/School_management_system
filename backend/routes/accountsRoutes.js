const express = require("express");
const router = express.Router();

const {
    // Fee structure
    getAllFees,
    getFeeById,
    createFee,
    updateFee,
    deleteFee,

    // Student fees
    assignFee,
    getStudentFees,

    // Dues
    getAllDues,

    // Payments
    createPayment,
    getPaymentHistory,

    // Income
    getAllIncome,
    createIncome,
    updateIncome,
    deleteIncome,

    // Expenses
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,

    // Payslips
    createPayslip,
    getAllPayslips,
    getPayslipById,
    markPayslipPaid

} = require("../controllers/accountsController");


// FEE STRUCTURE
router.get("/fee-structures", getAllFees);
router.get("/fee-structures/:id", getFeeById);
router.post("/fee-structures", createFee);
router.put("/fee-structures/:id", updateFee);
router.delete("/fee-structures/:id", deleteFee);


// STUDENT FEES
router.post("/student-fees", assignFee);
router.get("/student-fees/:studentId", getStudentFees);


// DUES
router.get("/dues", getAllDues);


// PAYMENTS
router.post("/payments", createPayment);
router.get("/payments", getPaymentHistory);


// INCOME
router.get("/income", getAllIncome);
router.post("/income", createIncome);
router.put("/income/:id", updateIncome);
router.delete("/income/:id", deleteIncome);


// EXPENSES
router.get("/expenses", getAllExpenses);
router.post("/expenses", createExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);


// PAYSLIPS
router.get("/payslips", getAllPayslips);
router.get("/payslips/:id", getPayslipById);
router.post("/payslips", createPayslip);
router.put("/payslips/:id/pay", markPayslipPaid);


module.exports = router;