const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all employees
router.get('/', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const employees = await db.all('SELECT * FROM employees_status ORDER BY id ASC');
        res.json(employees);
    } catch (error) {
        console.error('Fetch employees error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an employee's status/duty
router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { contact, status, duty } = req.body;

    try {
        const db = await getDB();
        const employee = await db.get('SELECT * FROM employees_status WHERE id = ?', [id]);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Business Logic: Only admins, superadmins, or the employee themselves can edit their info.
        // For simplicity, we assume the displayName in the users table matches the name in employees_status.
        // Specifically for Tara.
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            if (req.user.displayName !== employee.name && req.user.username !== employee.name.toLowerCase()) {
                return res.status(403).json({ error: 'You do not have permission to edit this employee.' });
            }
        }

        // Update fields if provided, otherwise keep existing
        const newContact = contact !== undefined ? contact : employee.contact;
        const newStatus = status !== undefined ? status : employee.status;
        const newDuty = duty !== undefined ? duty : employee.duty;

        await db.run(
            'UPDATE employees_status SET contact = ?, status = ?, duty = ? WHERE id = ?',
            [newContact, newStatus, newDuty, id]
        );

        res.json({ success: true, message: 'Employee updated successfully.' });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
