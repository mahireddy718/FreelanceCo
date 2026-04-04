const SibApiV3Sdk = require('@sendinblue/client');

// Initialize Brevo API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Verify API configuration on startup
if (!process.env.BREVO_API_KEY) {
    console.error('⚠️  BREVO_API_KEY is not set in environment variables');
    console.error('Please add BREVO_API_KEY to your .env file');
} else {
    console.log('✓ Brevo API client initialized successfully');
}

// Send OTP email using Brevo
const sendOTPEmail = async (email, name, otp) => {
    try {
        // Prepare email data
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = {
            name: process.env.BREVO_SENDER_NAME || 'FreelanceCo',
            email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER
        };

        sendSmtpEmail.to = [{
            email: email,
            name: name
        }];

        sendSmtpEmail.subject = 'Password Reset OTP - FreelanceCo';

        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #16a34a;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }
                    .content {
                        background-color: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 5px 5px;
                    }
                    .otp-box {
                        background-color: white;
                        border: 2px dashed #16a34a;
                        padding: 20px;
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 5px;
                        margin: 20px 0;
                        color: #16a34a;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>You requested to reset your password. Use the OTP below to proceed:</p>
                        <div class="otp-box">${otp}</div>
                        <p><strong>This code will expire in 10 minutes.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                        <p>Best regards,<br>The FreelanceCo Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email via Brevo API
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

        // Extract messageId from response
        const messageId = data.body?.messageId || data.messageId || 'sent';
        console.log('✓ OTP email sent successfully via Brevo:', messageId);

        return {
            success: true,
            messageId: messageId
        };
    } catch (error) {
        console.error('✗ Error sending OTP email via Brevo');
        console.error('Error details:', error.message);

        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Body:', JSON.stringify(error.response.body, null, 2));
        }

        if (error.body) {
            console.error('Error Body:', JSON.stringify(error.body, null, 2));
        }

        throw error;
    }
};

module.exports = {
    sendOTPEmail
};
