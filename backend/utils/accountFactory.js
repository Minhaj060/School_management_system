class AccountFactory {
    createIncome(data) {
        return {
            source: data.source.trim(),
            amount: Number(data.amount),
            income_date: data.income_date,
            description: data.description || null,
            created_by: data.created_by || null
        };
    }

    createExpense(data) {
        return {
            category: data.category.trim(),
            amount: Number(data.amount),
            expense_date: data.expense_date,
            description: data.description || null,
            created_by: data.created_by || null
        };
    }
}

module.exports = new AccountFactory();