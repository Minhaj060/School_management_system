class SalaryCalculationStrategy {
    calculate(basicSalary, allowance = 0, deduction = 0) {
        basicSalary = Number(basicSalary);
        allowance = Number(allowance);
        deduction = Number(deduction);

        if (
            !Number.isFinite(basicSalary) ||
            !Number.isFinite(allowance) ||
            !Number.isFinite(deduction) ||
            basicSalary < 0 ||
            allowance < 0 ||
            deduction < 0
        ) {
            throw new Error("Salary values must be valid non-negative numbers.");
        }

        const netSalary = Number(
            (basicSalary + allowance - deduction).toFixed(2)
        );

        if (netSalary < 0) {
            throw new Error("Deduction cannot exceed the total salary.");
        }

        return netSalary;
    }
}

module.exports = new SalaryCalculationStrategy();