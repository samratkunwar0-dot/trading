const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all payments (recent transactions)
router.get('/', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const payments = await db.all('SELECT * FROM payments ORDER BY id DESC LIMIT 10');
        res.json(payments);
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new payment (Quick Transfer)
router.post('/', requireAuth, async (req, res) => {
    const { entity, amount } = req.body;

    if (!entity || !amount) {
        return res.status(400).json({ error: 'Entity and amount are required.' });
    }

    try {
        const db = await getDB();
        const date = new Date().toISOString().split('T')[0];

        // Deduct from funds
        await db.run('UPDATE funds SET value = value - ? WHERE key = ?', [amount, 'money_earned']);

        await db.run(
            'INSERT INTO payments (type, entity, description, amount, date) VALUES (?, ?, ?, ?, ?)',
            ['Sent', entity, 'Quick Transfer', amount, date]
        );

        res.status(201).json({ success: true, message: 'Payment sent successfully.' });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a payment (Admin/Superadmin only)
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only admins and superadmins can delete payments.' });
    }

    try {
        const db = await getDB();
        const payment = await db.get('SELECT amount FROM payments WHERE id = ?', [id]);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found.' });
        }

        await db.run('DELETE FROM payments WHERE id = ?', [id]);

        // Refund the amount to funds
        await db.run('UPDATE funds SET value = value + ? WHERE key = ?', [payment.amount, 'money_earned']);

        res.json({ success: true, message: `Payment ${id} deleted successfully and funds refunded.` });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
