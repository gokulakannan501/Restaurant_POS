import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.log("RESEND API key missing. Dumping email content:");
            console.log({ to, subject, html });
            return false;
        }

        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject,
            html,
        });

        console.log("Email sent:", response.id || response);
        return true;

    } catch (error) {
        console.error("Error sending email:", error);
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
