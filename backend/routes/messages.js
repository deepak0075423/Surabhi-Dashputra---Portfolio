const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { normalizeBool, getStats, listMessages, setRead, deleteMessage } = require('../utils/messages-store');

const router = express.Router();

// GET /api/messages/stats (auth)
router.get('/stats', authMiddleware, async (_req, res) => {
    try {
        const stats = await getStats();
        res.json({ success: true, ...stats });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load message stats' });
    }
});

// GET /api/messages?limit=50&offset=0&unreadOnly=1&search=... (auth)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
        const unreadOnly = normalizeBool(req.query.unreadOnly) === true;
        const search = (req.query.search || '').trim();
        const { total, messages } = await listMessages({ limit, offset, unreadOnly, search });
        res.json({
            success: true,
            total,
            limit,
            offset,
            messages
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load messages' });
    }
});

// POST /api/messages/:id/read { read: true|false } (auth)
router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const readVal = normalizeBool(req.body && req.body.read);
        const read = readVal === null ? true : readVal;
        const msg = await setRead(id, read);
        if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true, id, read: msg.read });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to update message' });
    }
});

// DELETE /api/messages/:id (auth)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const ok = await deleteMessage(id);
        if (!ok) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
});

module.exports = router;
