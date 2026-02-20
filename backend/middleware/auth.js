const jwt = require('jsonwebtoken');
const { readJSON, adminPath } = require('../utils/json-store');

async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = header.slice(7);
    try {
        const admin = await readJSON(adminPath());
        if (!admin) {
            return res.status(500).json({ success: false, error: 'Admin not configured' });
        }
        const decoded = jwt.verify(token, admin.jwtSecret);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

// Simple in-memory rate limiter
function rateLimit({ windowMs = 900000, max = 5 } = {}) {
    const attempts = new Map();

    // Cleanup old entries every 5 minutes
    setInterval(() => {
        const cutoff = Date.now() - windowMs;
        for (const [ip, timestamps] of attempts) {
            const filtered = timestamps.filter(t => t > cutoff);
            if (filtered.length === 0) attempts.delete(ip);
            else attempts.set(ip, filtered);
        }
    }, 300000).unref();

    return function (req, res, next) {
        const ip = req.ip;
        const now = Date.now();
        const cutoff = now - windowMs;
        let timestamps = attempts.get(ip) || [];
        timestamps = timestamps.filter(t => t > cutoff);
        if (timestamps.length >= max) {
            return res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
        }
        timestamps.push(now);
        attempts.set(ip, timestamps);
        next();
    };
}

module.exports = { authMiddleware, rateLimit };
