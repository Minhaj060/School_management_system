class FeeFactory {
    createFee(data) {
        return {
            class_id: Number(data.class_id),
            fee_name: data.fee_name.trim(),
            amount: Number(data.amount),
            frequency: data.frequency || "monthly",
            description: data.description || null
        };
    }
}

module.exports = new FeeFactory();