const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const db = await getDB();
        const normalizedUsername = username.trim().toLowerCase();

        const user = await db.get('SELECT * FROM users WHERE username = ?', [normalizedUsername]);

        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { username: normalizedUsername, displayName: user.displayName, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            username: normalizedUsername,
            displayName: user.displayName,
            role: user.role,
            isAdmin: user.role === 'admin' || user.role === 'superadmin',
            isSuperAdmin: user.role === 'superadmin',
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/me', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [req.user.username]);

        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json({
            username: req.user.username,
            displayName: user.displayName,
            role: user.role,
            isAdmin: user.role === 'admin' || user.role === 'superadmin',
            isSuperAdmin: user.role === 'superadmin',
        });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
