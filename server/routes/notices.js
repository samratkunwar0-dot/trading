const express = require('express');
const { getDB } = require('../db');
const { requireAuth, requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all notices
router.get('/', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const notices = await db.all('SELECT * FROM notices ORDER BY id DESC');
        res.json(notices);
    } catch (error) {
        console.error('Fetch notices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new notice
router.post('/', requireAuth, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    // Usually admins post notices
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins and superadmins can post notices.' });
    }

    try {
        const db = await getDB();
        const date = new Date().toISOString().split('T')[0];

        const result = await db.run(
            'INSERT INTO notices (title, content, date, author) VALUES (?, ?, ?, ?)',
            [title, content, date, req.user.displayName]
        );

        res.status(201).json({ success: true, message: 'Notice posted.', id: result.lastID });
    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
