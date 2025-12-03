import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    debug: true,
    logger: true
});

export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('SMTP credentials not found. Email content:');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Restaurant POS" <noreply@restaurantpos.com>',
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendWelcomeEmail = async (email, name, password) => {
    const subject = 'Welcome to The Classic Restaurant POS';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Welcome to The Classic Restaurant!</h2>
            <p>Hello ${name},</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p>Please login and change your password immediately.</p>
            <p>Best regards,<br>The Classic Restaurant Team</p>
        </div>
    `;

    return sendEmail(email, subject, html);
};
