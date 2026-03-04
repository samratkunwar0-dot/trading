const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mgtraders_super_secret_2026';

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

function requireSuperAdmin(req, res, next) {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Super Admin access required.' });
    }
    next();
}

module.exports = { requireAuth, requireSuperAdmin, JWT_SECRET };
