const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fsSync = require('fs');
const fs = require('fs/promises');

function loadDotEnvFrom(envPath) {
    // Optional local config file
    // Format: KEY=value (no export). Lines starting with # are ignored.
    let raw;
    try {
        raw = fsSync.readFileSync(envPath, 'utf8');
    } catch (err) {
        if (err && err.code === 'ENOENT') return false;
        throw err;
    }

    raw.split('\n').forEach((line) => {
        const trimmed = String(line || '').trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx <= 0) return;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!key) return;
        const shouldOverride =
            key === 'PORT' ||
            key.startsWith('SMTP_') ||
            key.startsWith('CONTACT_');
        if (shouldOverride || process.env[key] === undefined) {
            process.env[key] = val;
        }
    });
    return true;
}

const BACKEND_ENV_PATH = path.join(__dirname, '.env');
const ROOT_ENV_PATH = path.resolve(__dirname, '..', '.env');
const loadedBackendEnv = loadDotEnvFrom(BACKEND_ENV_PATH);
const loadedRootEnv = loadDotEnvFrom(ROOT_ENV_PATH);
if (loadedBackendEnv || loadedRootEnv) {
    console.log('[env] Loaded .env file' + (loadedBackendEnv && loadedRootEnv ? 's' : '') + '.');
}

// CMS route modules
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');
const messagesRoutes = require('./routes/messages');
const { rateLimit } = require('./middleware/auth');
const { addContactMessage, setEmailStatus } = require('./utils/messages-store');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/admin/*', (_req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));

// Serve frontend + assets when running the backend locally
const SITE_ROOT = path.resolve(__dirname, '..');
app.get('/', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'index.html')));
app.get('/script.js', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'script.js')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'styles.css')));
app.get('/favicon.png', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'favicon.png')));
app.get('/robots.txt', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'robots.txt')));
app.get('/sitemap.xml', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'sitemap.xml')));
app.use('/images', express.static(path.join(SITE_ROOT, 'images')));
app.use('/videos', express.static(path.join(SITE_ROOT, 'videos')));

function isImageFile(name) {
    const ext = path.extname(name || '').toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' || ext === '.gif' || ext === '.avif';
}

function normalizeCategory(raw) {
    const c = String(raw || '').toLowerCase();
    return c === 'stage' || c === 'studio' || c === 'bts' ? c : 'all';
}

function categoryFromFilename(filename) {
    const base = String(filename || '').toLowerCase();
    const m = base.match(/^(stage|studio|bts)[-_ ]/);
    return m ? normalizeCategory(m[1]) : 'all';
}

async function listGalleryImages() {
    const galleryDir = path.resolve(__dirname, '..', 'images', 'gallery');
    const out = [];

    let entries;
    try {
        entries = await fs.readdir(galleryDir, { withFileTypes: true });
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return out;
        throw e;
    }

    for (const ent of entries) {
        if (ent.isFile()) {
            if (!isImageFile(ent.name)) continue;
            out.push({
                src: path.posix.join('images', 'gallery', ent.name),
                category: categoryFromFilename(ent.name)
            });
            continue;
        }

        if (ent.isDirectory()) {
            const category = normalizeCategory(ent.name);
            const subdir = path.resolve(galleryDir, ent.name);
            let files = [];
            try {
                files = await fs.readdir(subdir, { withFileTypes: true });
            } catch (_) {
                continue;
            }
            for (const f of files) {
                if (!f.isFile()) continue;
                if (!isImageFile(f.name)) continue;
                out.push({
                    src: path.posix.join('images', 'gallery', ent.name, f.name),
                    category
                });
            }
        }
    }

    // Dedupe + stable natural-ish sort
    const seen = new Set();
    const deduped = [];
    for (const item of out) {
        if (!item || !item.src) continue;
        if (seen.has(item.src)) continue;
        seen.add(item.src);
        deduped.push(item);
    }
    deduped.sort((a, b) => String(a.src).localeCompare(String(b.src), undefined, { numeric: true, sensitivity: 'base' }));
    return deduped;
}

// SMTP Configuration
const SMTP_HOST = (process.env.SMTP_HOST || '').trim();
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 0;
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').trim() === '1';
const SMTP_SERVICE = (process.env.SMTP_SERVICE || 'gmail').trim();
const SMTP_USER = (process.env.SMTP_USER || 'deepakpandey5423@gmail.com').trim();
const SMTP_PASS = process.env.SMTP_PASS || '';
const CONTACT_TO = (process.env.CONTACT_TO || 'ppdd5423@gmail.com').trim();
const CONTACT_FROM = (process.env.CONTACT_FROM || process.env.SMTP_FROM || SMTP_USER).trim();
const CONTACT_RECORD_ONLY = String(process.env.CONTACT_RECORD_ONLY || '').trim() === '1';

let transporter = null;
if (SMTP_PASS) {
    if (SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT || (SMTP_SECURE ? 465 : 587),
            secure: SMTP_SECURE,
            auth: { user: SMTP_USER, pass: SMTP_PASS }
        });
    } else {
        transporter = nodemailer.createTransport({
            service: SMTP_SERVICE,
            auth: { user: SMTP_USER, pass: SMTP_PASS }
        });
    }
}

if (!transporter) {
    console.log('\n⚠️  SMTP is not configured (missing SMTP_PASS). Contact emails will not be sent.');
    console.log('   Set env vars: SMTP_USER, SMTP_PASS, CONTACT_TO (optional), SMTP_SERVICE (optional)');
    console.log('   Or create backend/.env or root .env with those keys.\n');
} else {
    if (SMTP_HOST) {
        console.log(`[smtp] Using host transport: ${SMTP_HOST}:${SMTP_PORT || (SMTP_SECURE ? 465 : 587)} (secure=${SMTP_SECURE ? 'true' : 'false'})`);
    } else {
        console.log(`[smtp] Using service transport: ${SMTP_SERVICE}`);
    }
    transporter.verify(function (error) {
        if (error) {
            console.log('\n❌ SMTP Connection Error:', error.message);
        } else {
            console.log('\n✅ SMTP Server is ready to send emails!');
            console.log('   From:', CONTACT_FROM);
            console.log('   To:', CONTACT_TO, '\n');
        }
    });
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeHeader(s) {
    return String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
}

const contactLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required'
        });
    }

    // Save a record in CMS (messages inbox)
    let record = null;
    try {
        record = await addContactMessage({
            name: String(name).trim(),
            email: String(email).trim(),
            subject: String(subject).trim(),
            message: String(message),
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    } catch (err) {
        console.error('Message record save error:', err && err.message ? err.message : err);
        return res.status(500).json({ success: false, error: 'Failed to save message' });
    }

    // Email options
    const mailOptions = {
        from: `"${sanitizeHeader(name)}" <${CONTACT_FROM}>`,
        replyTo: sanitizeHeader(email),
        to: CONTACT_TO,
        subject: `[Contact Form] ${sanitizeHeader(subject)} - from ${sanitizeHeader(name)}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4a227; border-bottom: 2px solid #d4a227; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(subject)}</td>
                    </tr>
                </table>
                <div style="margin-top: 20px;">
                    <h3 style="color: #333;">Message:</h3>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
                    This email was sent from the contact form on Surabhi Dashputra's website.
                </p>
            </div>
        `,
        text: `
New Contact Form Submission
---------------------------
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
        `
    };

    try {
        if (!transporter) {
            await setEmailStatus(record.id, { emailSent: false, emailError: 'SMTP not configured' });
            if (CONTACT_RECORD_ONLY) {
                return res.json({ success: true, recorded: true, emailSent: false, id: record.id });
            }
            return res.status(500).json({ success: false, recorded: true, emailSent: false, id: record.id, error: 'Email not sent: SMTP not configured' });
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully from ${name} (${email})`);
        console.log('Message ID:', info.messageId);
        await setEmailStatus(record.id, { emailSent: true, emailError: null });
        res.json({ success: true, recorded: true, emailSent: true, id: record.id });
    } catch (error) {
        console.error('=== EMAIL ERROR ===');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Response:', error.response);
        console.error('Full error:', JSON.stringify(error, null, 2));

        try {
            await setEmailStatus(record.id, { emailSent: false, emailError: error.message || 'Email send failed' });
        } catch (_) {}

        res.status(500).json({
            success: false,
            recorded: true,
            emailSent: false,
            id: record.id,
            error: 'Email failed: ' + error.message,
            code: error.code
        });
    }
});

// Share transporter with auth routes (for password reset emails)
app.locals.transporter = transporter;

// CMS API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messagesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', cms: true });
});

// Gallery images endpoint (reads from ../images/gallery + CMS content)
app.get('/api/gallery', async (_req, res) => {
    try {
        const fsImages = await listGalleryImages();
        // Also include CMS-managed gallery images
        let cmsImages = [];
        try {
            const { readJSON, contentPath } = require('./utils/json-store');
            const galleryData = await readJSON(contentPath('gallery'));
            if (galleryData && Array.isArray(galleryData.images)) {
                cmsImages = galleryData.images.filter(img => img && img.src);
            }
        } catch (_) { /* CMS data not available, use filesystem only */ }
        // Merge: CMS images first, then filesystem, deduplicate by src
        const seen = new Set();
        const all = [];
        for (const img of [...cmsImages, ...fsImages]) {
            if (!img || !img.src || seen.has(img.src)) continue;
            seen.add(img.src);
            all.push(img);
        }
        res.json({ success: true, total: all.length, images: all });
    } catch (e) {
        res.status(500).json({ success: false, error: e && e.message ? e.message : 'Failed to list gallery images' });
    }
});

app.listen(PORT, () => {
    console.log(`\nSD Portfolio Backend running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST /api/contact        - Send contact form email');
    console.log('  GET  /api/gallery        - List gallery images');
    console.log('  GET  /api/health         - Health check');
    console.log('  POST /api/auth/login     - Admin login');
    console.log('  GET  /api/auth/verify    - Verify token');
    console.log('  GET  /api/content        - All CMS content');
    console.log('  GET  /api/content/:sec   - Single section');
    console.log('  PUT  /api/content/:sec   - Update section (auth)');
    console.log('  GET  /api/messages       - List contact messages (auth)');
    console.log('  GET  /api/messages/stats - Message stats (auth)');
    console.log(`\n  Admin Panel: http://localhost:${PORT}/admin\n`);
});
