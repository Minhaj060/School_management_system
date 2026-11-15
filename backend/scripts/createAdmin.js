
const bcrypt = require("bcrypt");
const readlineSync = require("readline-sync");
const db = require("../config/db");

async function createAdmin() {
    try {
        console.log("\n=== School Management Admin Setup ===\n");

        const fullName = readlineSync.question("Admin Full Name: ").trim();
        const email = readlineSync.question("Admin Email: ").trim().toLowerCase();
        const phone = readlineSync.question("Phone (optional): ").trim();

        const password = readlineSync.question("Admin Password: ", {
            hideEchoBack: true
        });

        if (!fullName || !email || !password) {
            throw new Error("Name, email and password are required.");
        }

        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        const [existingAdmins] = await db.query(
            "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1"
        );

        if (existingAdmins.length > 0) {
            throw new Error("An admin account already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.query(
            `INSERT INTO users
            (full_name, email, password, role, phone, status)
            VALUES (?, ?, ?, 'admin', ?, 'active')`,
            [fullName, email, hashedPassword, phone || null]
        );

        console.log("\nAdmin account created successfully!");

    } catch (error) {
        console.error("\nAdmin Setup Error:", error.message);
    } finally {
        await db.end();
    }
}

createAdmin();
