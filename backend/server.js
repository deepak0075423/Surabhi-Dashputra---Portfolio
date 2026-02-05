const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`\nContact form backend running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST /api/contact - Send contact form email');
    console.log('  GET  /api/health  - Health check\n');
});
