const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all bills
router.get('/', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const bills = await db.all('SELECT * FROM bills ORDER BY id DESC');
        res.json(bills);
    } catch (error) {
        console.error('Fetch bills error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new bill
router.post('/', requireAuth, async (req, res) => {
    const { clientName, date, amount, status } = req.body;

    if (!clientName || !date || amount === undefined) {
        return res.status(400).json({ error: 'clientName, date, and amount are required.' });
    }

    const billStatus = status || 'Pending';

    try {
        const db = await getDB();

        const result = await db.run(
            'INSERT INTO bills (clientName, date, amount, status) VALUES (?, ?, ?, ?)',
            [clientName, date, amount, billStatus]
        );

        // If the new bill is marked as paid immediately, update the funds.
        if (billStatus === 'Paid') {
            await db.run('UPDATE funds SET value = value + ? WHERE key = ?', [amount, 'money_earned']);
        }

        res.status(201).json({ success: true, message: 'Bill created.', id: result.lastID });
    } catch (error) {
        console.error('Create bill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a bill's status (e.g., mark as Paid)
router.put('/:id/status', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'status is required.' });
    }

    try {
        const db = await getDB();

        const bill = await db.get('SELECT amount, status FROM bills WHERE id = ?', [id]);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found.' });
        }

        if (bill.status === status) {
            return res.json({ success: true, message: 'Status unchanged.' });
        }

        await db.run('UPDATE bills SET status = ? WHERE id = ?', [status, id]);

        // If it changed to Paid, add to funds. If it changed from Paid to Pending, subtract.
        if (status === 'Paid') {
            await db.run('UPDATE funds SET value = value + ? WHERE key = ?', [bill.amount, 'money_earned']);
        } else if (bill.status === 'Paid' && status !== 'Paid') {
            await db.run('UPDATE funds SET value = value - ? WHERE key = ?', [bill.amount, 'money_earned']);
        }

        res.json({ success: true, message: `Bill ${id} status updated to ${status}.` });
    } catch (error) {
        console.error('Update bill status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a bill (Admin/Superadmin only)
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only admins and superadmins can delete bills.' });
    }

    try {
        const db = await getDB();
        const bill = await db.get('SELECT amount, status FROM bills WHERE id = ?', [id]);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found.' });
        }

        await db.run('DELETE FROM bills WHERE id = ?', [id]);

        // If the bill was paid, subtract its amount from the funds
        if (bill.status === 'Paid') {
            await db.run('UPDATE funds SET value = value - ? WHERE key = ?', [bill.amount, 'money_earned']);
        }

        res.json({ success: true, message: `Bill ${id} deleted successfully.` });
    } catch (error) {
        console.error('Delete bill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
