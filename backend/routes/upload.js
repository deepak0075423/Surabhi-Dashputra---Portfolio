const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const SITE_ROOT = path.resolve(__dirname, '..', '..');

// Upload destinations
const DIRS = {
    images: path.join(SITE_ROOT, 'images'),
    gallery: path.join(SITE_ROOT, 'images', 'gallery'),
    logo: path.join(SITE_ROOT, 'images', 'logo'),
    videos: path.join(SITE_ROOT, 'videos')
};

// Allowed MIME types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALL_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

// Multer storage — saves to the correct folder based on `type` field
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        // Set by the route handler via req._uploadDir
        cb(null, _req._uploadDir || DIRS.images);
    },
    filename: function (_req, file, cb) {
        // Keep original name but sanitize it
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_\-. ]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 80);
        const unique = Date.now().toString(36);
        cb(null, base + '-' + unique + ext);
    }
});

function fileFilter(allowedTypes) {
    return function (_req, file, cb) {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Accepted: ' + allowedTypes.join(', ')));
        }
    };
}

const uploadImage = multer({
    storage,
    fileFilter: fileFilter(IMAGE_TYPES),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadVideo = multer({
    storage,
    fileFilter: fileFilter(VIDEO_TYPES),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const uploadAny = multer({
    storage,
    fileFilter: fileFilter(ALL_TYPES),
    limits: { fileSize: 100 * 1024 * 1024 }
});

// Ensure directory exists
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

// POST /api/upload/image   — upload to images/
router.post('/image', authMiddleware, async (req, res, next) => {
    req._uploadDir = DIRS.images;
    await ensureDir(DIRS.images);
    next();
}, uploadImage.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const relativePath = 'images/' + req.file.filename;
    res.json({ success: true, path: relativePath, filename: req.file.filename });
});

// POST /api/upload/gallery — upload to images/gallery/
router.post('/gallery', authMiddleware, async (req, res, next) => {
    req._uploadDir = DIRS.gallery;
    await ensureDir(DIRS.gallery);
    next();
}, uploadImage.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const relativePath = 'images/gallery/' + req.file.filename;
    res.json({ success: true, path: relativePath, filename: req.file.filename });
});

// POST /api/upload/logo — upload to images/logo/
router.post('/logo', authMiddleware, async (req, res, next) => {
    req._uploadDir = DIRS.logo;
    await ensureDir(DIRS.logo);
    next();
}, uploadImage.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const relativePath = 'images/logo/' + req.file.filename;
    res.json({ success: true, path: relativePath, filename: req.file.filename });
});

// POST /api/upload/video — upload to videos/
router.post('/video', authMiddleware, async (req, res, next) => {
    req._uploadDir = DIRS.videos;
    await ensureDir(DIRS.videos);
    next();
}, uploadVideo.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const relativePath = 'videos/' + req.file.filename;
    res.json({ success: true, path: relativePath, filename: req.file.filename });
});

// GET /api/upload/list/:type — list existing files for browsing
router.get('/list/:type', authMiddleware, async (req, res) => {
    const type = req.params.type;
    const dir = DIRS[type];
    if (!dir) return res.status(400).json({ success: false, error: 'Unknown type: ' + type });
    try {
        await ensureDir(dir);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = entries
            .filter(e => e.isFile() && !e.name.startsWith('.'))
            .map(e => {
                const prefix = type === 'videos' ? 'videos/' :
                    type === 'gallery' ? 'images/gallery/' :
                    type === 'logo' ? 'images/logo/' : 'images/';
                return { name: e.name, path: prefix + e.name };
            });
        res.json({ success: true, files });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Error handler for multer
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: 'File too large' });
        }
        return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
