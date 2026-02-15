const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend + assets when running the backend locally
const SITE_ROOT = path.resolve(__dirname, '..');
app.get('/', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'index.html')));
app.get('/script.js', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'script.js')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(SITE_ROOT, 'styles.css')));
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
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'deepakpandey5423@gmail.com',
        pass: 'qgcvykhzznnxcjqb'  // App Password without spaces
    }
});

// Verify SMTP connection
transporter.verify(function(error, success) {
    if (error) {
        console.log('\n❌ SMTP Connection Error:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\n🔑 Authentication failed! To fix this:');
            console.log('1. Go to https://myaccount.google.com/security');
            console.log('2. Enable 2-Step Verification (if not already enabled)');
            console.log('3. Go to https://myaccount.google.com/apppasswords');
            console.log('4. Generate a new App Password for "Mail"');
            console.log('5. Copy the 16-character password (without spaces)');
            console.log('6. Update the "pass" field in server.js\n');
        }
    } else {
        console.log('\n✅ SMTP Server is ready to send emails!');
        console.log('   From: deepakpandey5423@gmail.com');
        console.log('   To: ppdd5423@gmail.com\n');
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required'
        });
    }

    // Email options
    const mailOptions = {
        from: `"${name}" <deepakpandey5423@gmail.com>`,
        replyTo: email,
        to: 'ppdd5423@gmail.com',
        subject: `[Contact Form] ${subject} - from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4a227; border-bottom: 2px solid #d4a227; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <a href="mailto:${email}">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${subject}</td>
                    </tr>
                </table>
                <div style="margin-top: 20px;">
                    <h3 style="color: #333;">Message:</h3>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
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
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully from ${name} (${email})`);
        console.log('Message ID:', info.messageId);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('=== EMAIL ERROR ===');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Response:', error.response);
        console.error('Full error:', JSON.stringify(error, null, 2));

        res.status(500).json({
            success: false,
            error: 'Email failed: ' + error.message,
            code: error.code
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Gallery images endpoint (reads from ../images/gallery)
app.get('/api/gallery', async (_req, res) => {
    try {
        const images = await listGalleryImages();
        res.json({ success: true, total: images.length, images });
    } catch (e) {
        res.status(500).json({ success: false, error: e && e.message ? e.message : 'Failed to list gallery images' });
    }
});

app.listen(PORT, () => {
    console.log(`\nContact form backend running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST /api/contact - Send contact form email');
    console.log('  GET  /api/gallery - List gallery images');
    console.log('  GET  /api/health  - Health check\n');
});
