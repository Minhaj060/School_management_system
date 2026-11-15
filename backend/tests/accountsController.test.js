
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;

let mockModel;
let controller;

function setupController() {
    mockModel = {
        getAllFees: async () => [],
        getFeeById: async () => [],
        createFee: async () => ({ insertId: 1 }),
        updateFee: async () => ({ affectedRows: 1 }),
        deleteFee: async () => ({ affectedRows: 1 }),
        assignFee: async () => ({ insertId: 1 }),
        getStudentFees: async () => [],
        getAllDues: async () => [],
        createPayment: async () => ({ insertId: 1 }),
        getPaymentHistory: async () => [],
        getAllIncome: async () => [],
        createIncome: async () => ({ insertId: 1 }),
        updateIncome: async () => ({ affectedRows: 1 }),
        deleteIncome: async () => ({ affectedRows: 1 }),
        getAllExpenses: async () => [],
        createExpense: async () => ({ insertId: 1 }),
        updateExpense: async () => ({ affectedRows: 1 }),
        deleteExpense: async () => ({ affectedRows: 1 }),
        getSalaryByUser: async () => [{ basic_salary: 20000 }],
        checkPayslipExists: async () => [],
        createPayslip: async () => ({ insertId: 1 }),
        getAllPayslips: async () => [],
        getPayslipById: async () => [],
        markPayslipPaid: async () => ({ affectedRows: 1 })
    };

    Module._load = function (request, parent, isMain) {
        if (request === "../models/accountsModel" &&
            parent.filename.includes("accountsController")) {
            return mockModel;
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[require.resolve("../controllers/accountsController")];
    controller = require("../controllers/accountsController");
}

function restoreController() {
    Module._load = originalLoad;
}

function mockResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

async function callController(method, req = {}) {
    const res = mockResponse();
    await controller[method](
        { body: {}, params: {}, query: {}, ...req },
        res
    );
    return res;
}

test("Controller: getAllFees returns fee list", async () => {
    setupController();

    mockModel.getAllFees = async () => [{ fee_id: 1 }];

    const res = await callController("getAllFees");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: getFeeById rejects invalid ID", async () => {
    setupController();

    const res = await callController("getFeeById", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createFee rejects invalid data", async () => {
    setupController();

    const res = await callController("createFee", {
        body: { class_id: 0, fee_name: "", amount: -100 }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateFee rejects invalid ID", async () => {
    setupController();

    const res = await callController("updateFee", {
        params: { id: "abc" },
        body: { fee_name: "Updated" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: deleteFee rejects invalid ID", async () => {
    setupController();

    const res = await callController("deleteFee", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: assignFee rejects missing student ID", async () => {
    setupController();

    const res = await callController("assignFee", {
        body: { fee_id: 1 }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getStudentFees rejects invalid student ID", async () => {
    setupController();

    const res = await callController("getStudentFees", {
        params: { studentId: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getAllDues returns due records", async () => {
    setupController();

    const res = await callController("getAllDues");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: createPayment rejects invalid payment amount", async () => {
    setupController();

    const res = await callController("createPayment", {
        body: {
            student_id: 1,
            student_fee_id: 1,
            amount: -100,
            payment_method: "cash"
        }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getPaymentHistory returns history", async () => {
    setupController();

    const res = await callController("getPaymentHistory");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: getAllIncome returns income records", async () => {
    setupController();

    const res = await callController("getAllIncome");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: createIncome rejects invalid data", async () => {
    setupController();

    const res = await callController("createIncome", {
        body: { source: "", amount: -100, income_date: "" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateIncome rejects invalid ID", async () => {
    setupController();

    const res = await callController("updateIncome", {
        params: { id: "abc" },
        body: { amount: 100 }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: deleteIncome rejects invalid ID", async () => {
    setupController();

    const res = await callController("deleteIncome", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getAllExpenses returns expense records", async () => {
    setupController();

    const res = await callController("getAllExpenses");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: createExpense rejects invalid data", async () => {
    setupController();

    const res = await callController("createExpense", {
        body: { category: "", amount: -100, expense_date: "" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateExpense rejects invalid ID", async () => {
    setupController();

    const res = await callController("updateExpense", {
        params: { id: "abc" },
        body: { amount: 100 }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: deleteExpense rejects invalid ID", async () => {
    setupController();

    const res = await callController("deleteExpense", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createPayslip rejects invalid user ID", async () => {
    setupController();

    const res = await callController("createPayslip", {
        body: { user_id: 0, salary_month: "November 2026" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getAllPayslips returns payslips", async () => {
    setupController();

    const res = await callController("getAllPayslips");

    assert.equal(res.statusCode, 200);

    restoreController();
});

test("Controller: getPayslipById rejects invalid ID", async () => {
    setupController();

    const res = await callController("getPayslipById", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: markPayslipPaid rejects invalid ID", async () => {
    setupController();

    const res = await callController("markPayslipPaid", {
        params: { id: "abc" },
        body: { payment_date: "2026-11-15" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});
