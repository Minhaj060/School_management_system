
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

const allowedRoles = [
    "admin",
    "teacher",
    "accountant",
    "parent",
    "student"
];

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users."
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await userModel.getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user."
        });
    }
};

// Create user
const createUser = async (req, res) => {
    try {
        const { full_name, email, password, role, phone } = req.body;

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required."
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userId = await userModel.createUser({
            full_name: full_name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role,
            phone
        });

        res.status(201).json({
            success: true,
            message: "User created successfully.",
            user_id: userId
        });
    } catch (error) {
        console.error("Create User Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create user."
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { full_name, email, role, phone, status } = req.body;

        if (!full_name || !email || !role || !status) {
            return res.status(400).json({
                success: false,
                message: "Name, email, role and status are required."
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account status."
            });
        }

        const affectedRows = await userModel.updateUser(
            req.params.id,
            {
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                role,
                phone,
                status
            }
        );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "User not found or no changes made."
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully."
        });
    } catch (error) {
        console.error("Update User Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update user."
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (userId === req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        const affectedRows = await userModel.deleteUser(userId);

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user."
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
