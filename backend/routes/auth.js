const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, adminPath, resetTokensPath } = require('../utils/json-store');
const { authMiddleware, rateLimit } = require('../middleware/auth');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }

        const admin = await readJSON(adminPath());
        if (!admin) {
            return res.status(500).json({ success: false, error: 'Admin not configured. Run seed script first.' });
        }

        if (username !== admin.username) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: admin.username }, admin.jwtSecret, { expiresIn: '24h' });
        res.json({ success: true, token });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ success: true, username: req.admin.username });
});

// POST /api/auth/reset-password  (request a reset link)
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const genericMsg = 'If that email is registered, a reset link has been sent.';

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const admin = await readJSON(adminPath());
        if (!admin || admin.email !== email) {
            // Don't reveal whether the email exists
            return res.json({ success: true, message: genericMsg });
        }

        // Generate reset token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        let tokensData = await readJSON(resetTokensPath()) || { tokens: [] };
        // Clean expired tokens
        tokensData.tokens = tokensData.tokens.filter(t => new Date(t.expiresAt) > new Date() && !t.used);
        tokensData.tokens.push({ token, expiresAt, used: false });
        await writeJSON(resetTokensPath(), tokensData);

        // Send email using the transporter from server.js (passed via app.locals)
        const transporter = req.app.locals.transporter;
        if (transporter) {
            const resetUrl = `${req.protocol}://${req.get('host')}/admin?reset=${token}`;
            await transporter.sendMail({
                from: `"SD Portfolio Admin" <${admin.email}>`,
                to: admin.email,
                subject: 'Password Reset - SD Portfolio Admin',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                        <h2 style="color:#d4a227;">Password Reset</h2>
                        <p>Click the link below to reset your admin password. This link expires in 1 hour.</p>
                        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#d4a227;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
                        <p style="color:#888;font-size:12px;margin-top:20px;">If you didn't request this, ignore this email.</p>
                    </div>
                `,
                text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`
            });
        }

        res.json({ success: true, message: genericMsg });
    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/auth/reset-password/:token  (set new password)
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        let tokensData = await readJSON(resetTokensPath());
        if (!tokensData || !tokensData.tokens) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        }

        const entry = tokensData.tokens.find(t => t.token === token && !t.used && new Date(t.expiresAt) > new Date());
        if (!entry) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        }

        // Hash new password and update admin
        const admin = await readJSON(adminPath());
        admin.passwordHash = await bcrypt.hash(newPassword, 10);
        await writeJSON(adminPath(), admin);

        // Mark token as used
        entry.used = true;
        await writeJSON(resetTokensPath(), tokensData);

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Reset confirm error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/auth/change-password (change password while logged in)
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current and new password required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        }

        const admin = await readJSON(adminPath());
        const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        admin.passwordHash = await bcrypt.hash(newPassword, 10);
        await writeJSON(adminPath(), admin);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
