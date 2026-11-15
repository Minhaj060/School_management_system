
const salaryStrategy = require("./salaryCalculationStrategy");

class SalaryFactory {
    createPayslip(data) {
        const basicSalary = Number(data.basic_salary);
        const allowance = Number(data.allowance || 0);
        const deduction = Number(data.deduction || 0);

        const netSalary = salaryStrategy.calculate(
            basicSalary,
            allowance,
            deduction
        );

        return {
            user_id: Number(data.user_id),
            salary_month: data.salary_month.trim(),
            basic_salary: basicSalary,
            allowance,
            deduction,
            net_salary: netSalary,
            payment_date: data.payment_date || null,
            status: "generated"
        };
    }
}

module.exports = new SalaryFactory();
