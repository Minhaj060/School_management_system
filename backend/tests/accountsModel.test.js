


const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;

let mockDb;
let accountsModel;

function setupModel() {
    mockDb = {
        query: async () => [[], []],

        getConnection: async () => ({
            query: async () => [[], []],
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {}
        })
    };

    Module._load = function (request, parent, isMain) {
        if (
            request === "../config/db" &&
            parent.filename.includes("accountsModel")
        ) {
            return mockDb;
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[require.resolve("../models/accountsModel")];

    accountsModel = require("../models/accountsModel");
}

function restoreModel() {
    Module._load = originalLoad;
}

test("getAllFees returns fee records", async () => {
    setupModel();

    mockDb.query = async () => [[{ fee_id: 1, fee_name: "Tuition" }], []];

    const result = await accountsModel.getAllFees();

    assert.equal(result.length, 1);
    assert.equal(result[0].fee_name, "Tuition");

    restoreModel();
});

test("getFeeById returns undefined when fee is missing", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await accountsModel.getFeeById(999);

    assert.equal(result, undefined);

    restoreModel();
});

test("getFeeById returns an existing fee", async () => {
    setupModel();

    mockDb.query = async () => [[{ fee_id: 1, fee_name: "Tuition" }], []];

    const result = await accountsModel.getFeeById(1);

    assert.equal(result.fee_id, 1);

    restoreModel();
});

test("createFee inserts and retrieves a fee", async () => {
    setupModel();

    let calls = 0;

    mockDb.query = async () => {
        calls++;

        if (calls === 1) {
            return [{ insertId: 10 }, []];
        }

        return [[{ fee_id: 10, fee_name: "Tuition" }], []];
    };

    const result = await accountsModel.createFee({
        class_id: 1,
        fee_name: "Tuition",
        amount: 1500,
        frequency: "monthly",
        description: ""
    });

    assert.equal(result.fee_id, 10);

    restoreModel();
});

test("updateFee returns affected rows", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    const result = await accountsModel.updateFee(1, {
        class_id: 1,
        fee_name: "Updated Tuition",
        amount: 2000,
        frequency: "monthly",
        description: ""
    });

    assert.equal(result, 1);

    restoreModel();
});

test("updateFee returns zero for missing fee", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    const result = await accountsModel.updateFee(999, {
        class_id: 1,
        fee_name: "Updated",
        amount: 2000,
        frequency: "monthly",
        description: ""
    });

    assert.equal(result, 0);

    restoreModel();
});

test("deleteFee deletes a fee", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(await accountsModel.deleteFee(1), 1);

    restoreModel();
});

test("deleteFee returns zero when fee does not exist", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    assert.equal(await accountsModel.deleteFee(999), 0);

    restoreModel();
});

test("assignFee inserts a student fee", async () => {
    setupModel();

    let calls = 0;

    mockDb.query = async () => {
        calls++;

        if (calls === 1) return [[{ class_id: 1 }], []];
        if (calls === 2) return [[{ class_id: 1, amount: 1500 }], []];

        return [{ insertId: 5 }, []];
    };

    const result = await accountsModel.assignFee({
        student_id: 1,
        fee_id: 1,
        due_date: "2026-12-01"
    });

    assert.equal(result, 5);

    restoreModel();
});

test("assignFee rejects a missing student", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    await assert.rejects(
        accountsModel.assignFee({ student_id: 999, fee_id: 1 }),
        /Student not found/
    );

    restoreModel();
});

test("getStudentFees returns student fee records", async () => {
    setupModel();

    mockDb.query = async () => [[{ student_fee_id: 1 }], []];

    const result = await accountsModel.getStudentFees(1);

    assert.equal(result.length, 1);

    restoreModel();
});

test("getStudentFees returns empty list when no fees exist", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await accountsModel.getStudentFees(999);

    assert.deepEqual(result, []);

    restoreModel();
});

test("getAllDues calculates outstanding amount", async () => {
    setupModel();

    mockDb.query = async () => [[{
        due_amount: 1000,
        paid_amount: 400
    }], []];

    const result = await accountsModel.getAllDues();

    assert.equal(result[0].outstanding, 600);

    restoreModel();
});

test("getAllDues returns empty list when no dues exist", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await accountsModel.getAllDues();

    assert.deepEqual(result, []);

    restoreModel();
});

test("createPayment records a payment and commits transaction", async () => {
    setupModel();

    let committed = false;

    mockDb.getConnection = async () => ({
        beginTransaction: async () => {},
        query: async (sql) => {
            if (sql.includes("SELECT")) {
                return [[{
                    due_amount: 1000,
                    paid_amount: 300
                }], []];
            }

            if (sql.includes("INSERT")) {
                return [{ insertId: 10 }, []];
            }

            return [{ affectedRows: 1 }, []];
        },
        commit: async () => {
            committed = true;
        },
        rollback: async () => {},
        release: () => {}
    });

    const result = await accountsModel.createPayment({
        student_id: 1,
        student_fee_id: 1,
        amount: 200,
        payment_method: "cash"
    });

    assert.equal(result.payment_id, 10);
    assert.equal(result.paid_amount, 500);
    assert.equal(result.status, "partial");
    assert.equal(committed, true);

    restoreModel();
});

test("createPayment rolls back when fee record is missing", async () => {
    setupModel();

    let rolledBack = false;

    mockDb.getConnection = async () => ({
        beginTransaction: async () => {},
        query: async () => [[], []],
        commit: async () => {},
        rollback: async () => {
            rolledBack = true;
        },
        release: () => {}
    });

    await assert.rejects(
        accountsModel.createPayment({
            student_id: 1,
            student_fee_id: 999,
            amount: 100
        }),
        /Student fee record not found/
    );

    assert.equal(rolledBack, true);

    restoreModel();
});

test("getPaymentHistory returns payment records", async () => {
    setupModel();

    mockDb.query = async () => [[{ payment_id: 1, amount: 500 }], []];

    const result = await accountsModel.getPaymentHistory();

    assert.equal(result.length, 1);

    restoreModel();
});

test("getPaymentHistory returns empty list", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await accountsModel.getPaymentHistory();

    assert.deepEqual(result, []);

    restoreModel();
});

test("getAllIncome returns income records", async () => {
    setupModel();

    mockDb.query = async () => [[{ income_id: 1 }], []];

    assert.equal((await accountsModel.getAllIncome()).length, 1);

    restoreModel();
});

test("createIncome inserts income", async () => {
    setupModel();

    mockDb.query = async () => [{ insertId: 5 }, []];

    assert.equal(await accountsModel.createIncome({
        source: "Admission Fee",
        amount: 5000,
        income_date: "2026-11-15",
        description: "",
        created_by: 1
    }), 5);

    restoreModel();
});

test("updateIncome updates income", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(await accountsModel.updateIncome(1, {
        source: "Admission Fee",
        amount: 5000,
        income_date: "2026-11-15",
        description: ""
    }), 1);

    restoreModel();
});

test("deleteIncome deletes income", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(await accountsModel.deleteIncome(1), 1);

    restoreModel();
});

test("getAllExpenses returns expense records", async () => {
    setupModel();

    mockDb.query = async () => [[{ expense_id: 1 }], []];

    assert.equal((await accountsModel.getAllExpenses()).length, 1);

    restoreModel();
});

test("createExpense inserts expense", async () => {
    setupModel();

    mockDb.query = async () => [{ insertId: 5 }, []];

    assert.equal(await accountsModel.createExpense({
        category: "Electricity",
        amount: 2000,
        expense_date: "2026-11-15",
        description: "",
        created_by: 1
    }), 5);

    restoreModel();
});

test("updateExpense updates expense", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(await accountsModel.updateExpense(1, {
        category: "Electricity",
        amount: 2000,
        expense_date: "2026-11-15",
        description: ""
    }), 1);

    restoreModel();
});

test("deleteExpense deletes expense", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(await accountsModel.deleteExpense(1), 1);

    restoreModel();
});

test("getSalaryByUser returns salary record", async () => {
    setupModel();

    mockDb.query = async () => [[{ basic_salary: 20000 }], []];

    const result = await accountsModel.getSalaryByUser(1);

    assert.equal(result.basic_salary, 20000);

    restoreModel();
});

test("getSalaryByUser returns undefined for missing user", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    assert.equal(await accountsModel.getSalaryByUser(999), undefined);

    restoreModel();
});

test("checkPayslipExists returns true when payslip exists", async () => {
    setupModel();

    mockDb.query = async () => [[{ payslip_id: 1 }], []];

    assert.equal(
        await accountsModel.checkPayslipExists(1, "November 2026"),
        true
    );

    restoreModel();
});

test("checkPayslipExists returns false when payslip does not exist", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    assert.equal(
        await accountsModel.checkPayslipExists(1, "November 2026"),
        false
    );

    restoreModel();
});

test("createPayslip inserts payslip", async () => {
    setupModel();

    mockDb.query = async () => [{ insertId: 10 }, []];

    assert.equal(await accountsModel.createPayslip({
        user_id: 1,
        salary_month: "November 2026",
        basic_salary: 20000,
        allowance: 2000,
        deduction: 1000,
        net_salary: 21000,
        payment_date: null,
        status: "generated"
    }), 10);

    restoreModel();
});

test("getAllPayslips returns payslips", async () => {
    setupModel();

    mockDb.query = async () => [[{ payslip_id: 1 }], []];

    assert.equal((await accountsModel.getAllPayslips()).length, 1);

    restoreModel();
});

test("getPayslipById returns undefined for missing payslip", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    assert.equal(await accountsModel.getPayslipById(999), undefined);

    restoreModel();
});

test("markPayslipPaid updates payslip status", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    assert.equal(
        await accountsModel.markPayslipPaid(1, "2026-11-15"),
        1
    );

    restoreModel();
});
