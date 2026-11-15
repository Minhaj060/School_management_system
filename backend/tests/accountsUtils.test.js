


const test = require("node:test");
const assert = require("node:assert/strict");

const FeeFactory = require("../utils/feeFactory");
const AccountFactory = require("../utils/accountFactory");
const SalaryFactory = require("../utils/salaryFactory");

const DueCalculationStrategy = require("../utils/dueCalculationStrategy");
const PaymentAllocationStrategy = require("../utils/paymentAllocationStrategy");
const SalaryCalculationStrategy = require("../utils/salaryCalculationStrategy");

// ================= DUE CALCULATION =================

test("Due calculation: calculates outstanding amount", () => {
    assert.equal(DueCalculationStrategy.calculate(1000, 400), 600);
});

test("Due calculation: never returns negative due", () => {
    assert.equal(DueCalculationStrategy.calculate(1000, 1200), 0);
});

// ================= PAYMENT ALLOCATION =================

test("Payment allocation: accepts partial payment", () => {
    const result = PaymentAllocationStrategy.calculate(1000, 300, 200);

    assert.equal(result.paid_amount, 500);
    assert.equal(result.status, "partial");
});

test("Payment allocation: accepts full payment", () => {
    const result = PaymentAllocationStrategy.calculate(1000, 500, 500);

    assert.equal(result.paid_amount, 1000);
    assert.equal(result.status, "paid");
});

test("Payment allocation: rejects excessive payment", () => {
    assert.throws(
        () => PaymentAllocationStrategy.calculate(1000, 500, 600),
        /Payment cannot/
    );
});

test("Payment allocation: rejects zero payment", () => {
    assert.throws(
        () => PaymentAllocationStrategy.calculate(1000, 500, 0),
        /Payment amount/
    );
});

// ================= SALARY CALCULATION =================

test("Salary calculation: calculates net salary", () => {
    assert.equal(SalaryCalculationStrategy.calculate(20000, 3000, 1000), 22000);
});

test("Salary calculation: works without allowance and deduction", () => {
    assert.equal(SalaryCalculationStrategy.calculate(20000, 0, 0), 20000);
});

test("Salary calculation: rejects negative salary values", () => {
    assert.throws(
        () => SalaryCalculationStrategy.calculate(-20000, 0, 0),
        /Salary values/
    );
});

test("Salary calculation: rejects excessive deduction", () => {
    assert.throws(
        () => SalaryCalculationStrategy.calculate(1000, 0, 1500),
        /Deduction cannot/
    );
});

// ================= FEE FACTORY =================

test("Fee factory: creates valid fee", () => {
    const fee = FeeFactory.createFee({
        class_id: 1,
        fee_name: "Tuition Fee",
        amount: 1500,
        frequency: "monthly",
        description: "Monthly tuition"
    });

    assert.equal(fee.class_id, 1);
    assert.equal(fee.fee_name, "Tuition Fee");
    assert.equal(fee.amount, 1500);
    assert.equal(fee.frequency, "monthly");
    assert.equal(fee.description, "Monthly tuition");
});

test("Fee factory: converts input values to expected types", () => {
    const fee = FeeFactory.createFee({
        class_id: "2",
        fee_name: "Exam Fee",
        amount: "800"
    });

    assert.equal(fee.class_id, 2);
    assert.equal(fee.amount, 800);
    assert.equal(fee.frequency, "monthly");
    assert.equal(fee.description, null);
});

// ================= ACCOUNT FACTORY =================

test("Account factory: creates valid income", () => {
    const income = AccountFactory.createIncome({
        source: "Admission Fee",
        amount: 5000,
        income_date: "2026-11-15",
        description: "Admission income",
        created_by: 1
    });

    assert.equal(income.source, "Admission Fee");
    assert.equal(income.amount, 5000);
    assert.equal(income.income_date, "2026-11-15");
    assert.equal(income.created_by, 1);
});

test("Account factory: applies default income values", () => {
    const income = AccountFactory.createIncome({
        source: "Tuition Fee",
        amount: "3000",
        income_date: "2026-11-15"
    });

    assert.equal(income.amount, 3000);
    assert.equal(income.description, null);
    assert.equal(income.created_by, null);
});

test("Account factory: creates valid expense", () => {
    const expense = AccountFactory.createExpense({
        category: "Electricity",
        amount: 2000,
        expense_date: "2026-11-15",
        description: "Electricity bill",
        created_by: 1
    });

    assert.equal(expense.category, "Electricity");
    assert.equal(expense.amount, 2000);
    assert.equal(expense.expense_date, "2026-11-15");
    assert.equal(expense.created_by, 1);
});

test("Account factory: applies default expense values", () => {
    const expense = AccountFactory.createExpense({
        category: "Maintenance",
        amount: "1000",
        expense_date: "2026-11-15"
    });

    assert.equal(expense.amount, 1000);
    assert.equal(expense.description, null);
    assert.equal(expense.created_by, null);
});

// ================= SALARY FACTORY =================

test("Salary factory: creates valid payslip", () => {
    const payslip = SalaryFactory.createPayslip({
        user_id: 1,
        salary_month: "November 2026",
        basic_salary: 20000,
        allowance: 2000,
        deduction: 1000
    });

    assert.equal(payslip.user_id, 1);
    assert.equal(payslip.net_salary, 21000);
    assert.equal(payslip.status, "generated");
});

test("Salary factory: rejects negative salary", () => {
    assert.throws(() => SalaryFactory.createPayslip({
        user_id: 1,
        salary_month: "November 2026",
        basic_salary: -20000,
        allowance: 0,
        deduction: 0
    }));
});
