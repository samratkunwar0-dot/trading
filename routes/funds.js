const express = require('express');
const { getDB } = require('../db');
const { requireAuth, requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get the total company funds earned
router.get('/', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const funds = await db.get('SELECT value FROM funds WHERE key = ?', ['money_earned']);
        res.json({ money_earned: funds ? funds.value : 0 });
    } catch (error) {
        console.error('Fetch funds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset the total company funds to 0
router.post('/reset', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const db = await getDB();
        await db.run('UPDATE funds SET value = ? WHERE key = ?', [0, 'money_earned']);

        // Also update all Paid bills to a different status so they aren't double counted?
        // Let's just reset the amount. This logic can be extended if they want 'Archived' bills.

        res.json({ success: true, message: 'Total funds have been reset to 0.', money_earned: 0 });
    } catch (error) {
        console.error('Reset funds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
