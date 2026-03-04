const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let dbInstance;

async function getDB() {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    await initializeSchema(dbInstance);
    return dbInstance;
}

async function initializeSchema(db) {
    // 1. Users Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            displayName TEXT NOT NULL,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);

    // 2. Bills Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientName TEXT NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending'
        )
    `);

    // 3. Notices Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL,
            author TEXT NOT NULL
        )
    `);

    // 4. Funds Table (Key-Value style for simplicity)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS funds (
            key TEXT PRIMARY KEY,
            value REAL NOT NULL
        )
    `);

    // 5. Employees Status Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS employees_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            contact TEXT NOT NULL,
            status TEXT NOT NULL,
            duty TEXT NOT NULL
        )
    `);

    // 6. Payments/Transfers Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            entity TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL
        )
    `);

    try {
        // Ensure 'money_earned' key exists
        await db.run('INSERT OR IGNORE INTO funds (key, value) VALUES (?, ?)', ['money_earned', 0]);

        // Insert Default Users if table is empty
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount && userCount.count === 0) {
            console.log('[DB] Seeding default users...');
            const defaultUsers = [
                { username: 'samrat', displayName: 'Samrat', password: 'samrat123', role: 'superadmin' },
                { username: 'mandira', displayName: 'Mandira', password: 'mandira123', role: 'admin' },
                { username: 'ganesh', displayName: 'Ganesh', password: 'ganesh123', role: 'admin' },
                { username: 'tara', displayName: 'Tara', password: 'tara123', role: 'employee' },
            ];

            for (const u of defaultUsers) {
                const hash = bcrypt.hashSync(u.password, 10);
                await db.run(
                    'INSERT INTO users (username, displayName, passwordHash, role) VALUES (?, ?, ?, ?)',
                    [u.username, u.displayName, hash, u.role]
                );
            }
        }

        // Insert Default Employees for Tracking if table is empty
        const empCount = await db.get('SELECT COUNT(*) as count FROM employees_status');
        if (empCount && empCount.count === 0) {
            console.log('[DB] Seeding default employees_status...');
            const defaultEmployees = [
                { name: 'John Doe', role: 'Delivery Driver', contact: '+977 9841234567', status: 'Active - On Route', duty: 'Deliveries to KTM Valley' },
                { name: 'Ram Sharma', role: 'Warehouse Manager', contact: '+977 9812345678', status: 'Active - In Office', duty: 'Inventory Check' },
                { name: 'Sita Rai', role: 'Logistics Coordinator', contact: '+977 9801234567', status: 'On Leave', duty: 'N/A' },
                { name: 'Hari Bahadur', role: 'Accountant', contact: '+977 9851234567', status: 'Active - In Office', duty: 'Monthly Audit' },
                { name: 'Gita Thapa', role: 'Sales Rep', contact: '+977 9861234567', status: 'Inactive', duty: 'N/A' },
                { name: 'Tara', role: 'Office Employee', contact: '+977 9822233344', status: 'Active - In Office', duty: 'Processing new clients' },
                { name: 'Krishna L.', role: 'Support Tech', contact: '+977 9833344455', status: 'Active - On Field', duty: 'Client hardware fix' },
                { name: 'Bishal K.', role: 'Driver', contact: '+977 9844455566', status: 'On Leave', duty: 'N/A' },
            ];

            for (const e of defaultEmployees) {
                await db.run(
                    'INSERT INTO employees_status (name, role, contact, status, duty) VALUES (?, ?, ?, ?, ?)',
                    [e.name, e.role, e.contact, e.status, e.duty]
                );
            }
        }
    } catch (err) {
        console.warn('[DB] Seeding skipped (Filesystem might be read-only):', err.message);
        // This is normal on Vercel if the DB is already bundled.
    }
}

module.exports = { getDB };
