import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: 'myRoommate <noreply@resend.dev>', // Use Resend's default domain for now
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('Email sent successfully:', result.data?.id);
    return true;
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

export function generateVerificationEmailTemplate(firstName: string, verificationToken: string): string {
  const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co' : 'http://localhost:5000'}/api/verify-email?token=${verificationToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify your email - myRoommate</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 32px; }
          .button { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; transition: transform 0.2s; }
          .button:hover { transform: translateY(-1px); }
          .footer { background: #f1f5f9; padding: 24px 32px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div style="padding: 40px 20px;">
          <div class="container">
            <div class="header">
              <h1>🏠 myRoommate</h1>
            </div>
            <div class="content">
              <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${firstName}!</h2>
              <p style="font-size: 16px; margin-bottom: 24px;">Welcome to myRoommate! To complete your registration and start managing your shared living experience, please verify your email address.</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 32px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 myRoommate. Making shared living seamless.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generatePasswordResetEmailTemplate(firstName: string, resetToken: string): string {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset your password - myRoommate</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 32px; }
          .button { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; transition: transform 0.2s; }
          .button:hover { transform: translateY(-1px); }
          .footer { background: #f1f5f9; padding: 24px 32px; text-align: center; color: #64748b; font-size: 14px; }
          .warning { background: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 24px 0; color: #92400e; }
        </style>
      </head>
      <body>
        <div style="padding: 40px 20px;">
          <div class="container">
            <div class="header">
              <h1>🏠 myRoommate</h1>
            </div>
            <div class="content">
              <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${firstName}!</h2>
              <p style="font-size: 16px; margin-bottom: 24px;">You requested to reset your password for your myRoommate account. Click the button below to set a new password.</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 32px;">If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #06b6d4; word-break: break-all;">${resetUrl}</a></p>
            </div>
            <div class="footer">
              <p>© 2025 myRoommate. Making shared living seamless.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}