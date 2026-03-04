const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db');
const { requireAuth, requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const db = await getDB();
        const users = await db.all('SELECT username, displayName, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.put('/:username/password', requireAuth, requireSuperAdmin, async (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    try {
        const db = await getDB();

        const user = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const passwordHash = bcrypt.hashSync(newPassword, 10);
        await db.run('UPDATE users SET passwordHash = ? WHERE username = ?', [passwordHash, username]);

        res.json({ success: true, message: `Password for ${username} updated.` });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
    const { username, displayName, password, role } = req.body;
    const validRoles = ['superadmin', 'admin', 'employee'];

    if (!username || !displayName || !password || !role) {
        return res.status(400).json({ error: 'username, displayName, password, and role are required.' });
    }
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    try {
        const db = await getDB();
        const normalizedUsername = username.trim().toLowerCase();

        const user = await db.get('SELECT username FROM users WHERE username = ?', [normalizedUsername]);
        if (user) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        await db.run(
            'INSERT INTO users (username, displayName, passwordHash, role) VALUES (?, ?, ?, ?)',
            [normalizedUsername, displayName, passwordHash, role]
        );

        res.status(201).json({ success: true, message: `User ${normalizedUsername} created.` });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/me', requireAuth, async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required for account deletion.' });
    }

    try {
        const db = await getDB();
        const user = await db.get('SELECT passwordHash FROM users WHERE username = ?', [req.user.username]);

        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        await db.run('DELETE FROM users WHERE username = ?', [req.user.username]);
        res.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/me/triple-click-delete', requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        const user = await db.get('SELECT username FROM users WHERE username = ?', [req.user.username]);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        await db.run('DELETE FROM users WHERE username = ?', [req.user.username]);
        res.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Triple-click delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
