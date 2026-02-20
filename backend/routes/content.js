const express = require('express');
const { readJSON, writeJSON, backupJSON, contentPath } = require('../utils/json-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_SECTIONS = [
    'meta', 'navigation', 'hero', 'about', 'stats', 'music',
    'films', 'news', 'youtube', 'jingles', 'reels', 'gallery',
    'academy', 'contact', 'footer', 'logo'
];

// GET /api/content - all sections combined
router.get('/', async (_req, res) => {
    try {
        const result = {};
        for (const section of ALLOWED_SECTIONS) {
            const data = await readJSON(contentPath(section));
            if (data) result[section] = data;
        }
        res.json(result);
    } catch (err) {
        console.error('Content read all error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to load content' });
    }
});

// GET /api/content/:section
router.get('/:section', async (req, res) => {
    const { section } = req.params;
    if (!ALLOWED_SECTIONS.includes(section)) {
        return res.status(404).json({ success: false, error: `Unknown section: ${section}` });
    }
    try {
        const data = await readJSON(contentPath(section));
        if (!data) {
            return res.status(404).json({ success: false, error: `Section "${section}" not found` });
        }
        res.json(data);
    } catch (err) {
        console.error(`Content read error [${section}]:`, err.message);
        res.status(500).json({ success: false, error: 'Failed to load content' });
    }
});

// PUT /api/content/:section (auth required)
router.put('/:section', authMiddleware, async (req, res) => {
    const { section } = req.params;
    if (!ALLOWED_SECTIONS.includes(section)) {
        return res.status(404).json({ success: false, error: `Unknown section: ${section}` });
    }
    try {
        const filePath = contentPath(section);
        // Backup existing content before overwriting
        await backupJSON(filePath);
        // Write new content
        await writeJSON(filePath, req.body);
        res.json({ success: true, section, updatedAt: new Date().toISOString() });
    } catch (err) {
        console.error(`Content write error [${section}]:`, err.message);
        res.status(500).json({ success: false, error: 'Failed to save content' });
    }
});

module.exports = router;
