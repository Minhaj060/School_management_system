class DueCalculationStrategy {
    calculate(dueAmount, paidAmount) {
        return Math.max(
            Number(dueAmount) - Number(paidAmount),
            0
        );
    }
}

module.exports = new DueCalculationStrategy();