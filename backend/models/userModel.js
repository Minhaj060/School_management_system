
const db = require("../config/db");

// Get all users
const getAllUsers = async () => {
    const [users] = await db.query(
        `SELECT user_id, full_name, email, role, phone, status, created_at
         FROM users
         ORDER BY user_id DESC`
    );

    return users;
};

// Get user by ID
const getUserById = async (userId) => {
    const [users] = await db.query(
        `SELECT user_id, full_name, email, role, phone, status, created_at
         FROM users
         WHERE user_id = ?`,
        [userId]
    );

    return users[0];
};

// Create user
const createUser = async (userData) => {
    const {
        full_name,
        email,
        password,
        role,
        phone
    } = userData;

    const [result] = await db.query(
        `INSERT INTO users
        (full_name, email, password, role, phone, status)
        VALUES (?, ?, ?, ?, ?, 'active')`,
        [full_name, email, password, role, phone || null]
    );

    return result.insertId;
};

// Update user
const updateUser = async (userId, userData) => {
    const {
        full_name,
        email,
        role,
        phone,
        status
    } = userData;

    const [result] = await db.query(
        `UPDATE users
         SET full_name = ?, email = ?, role = ?, phone = ?, status = ?
         WHERE user_id = ?`,
        [full_name, email, role, phone || null, status, userId]
    );

    return result.affectedRows;
};

// Delete user
const deleteUser = async (userId) => {
    const [result] = await db.query(
        "DELETE FROM users WHERE user_id = ?",
        [userId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
