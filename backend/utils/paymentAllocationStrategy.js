class PaymentAllocationStrategy {
    calculate(dueAmount, paidAmount, paymentAmount) {
        dueAmount = Number(dueAmount);
        paidAmount = Number(paidAmount);
        paymentAmount = Number(paymentAmount);

        const outstanding = dueAmount - paidAmount;

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        if (paymentAmount > outstanding) {
            throw new Error("Payment cannot exceed the outstanding balance.");
        }

        const newPaidAmount = paidAmount + paymentAmount;

        let status = "unpaid";

        if (newPaidAmount >= dueAmount) {
            status = "paid";
        } else if (newPaidAmount > 0) {
            status = "partial";
        }

        return {
            paid_amount: newPaidAmount,
            status
        };
    }
}

module.exports = new PaymentAllocationStrategy();