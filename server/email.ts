import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string, firstName?: string) {
  const verificationUrl = `${process.env.REPL_ID ? `https://${process.env.REPL_ID}-00-1epp5col3qtfm.worf.replit.dev` : 'http://localhost:5000'}/api/verify-email?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'MyRoommate <noreply@myroommateapp.com>',
      to: [email],
      subject: 'Verify your email address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <div style="color: white; font-size: 32px; font-weight: bold;">M</div>
            </div>
            <h1 style="color: #1a1a1a; margin: 0;">Welcome to MyRoommate${firstName ? `, ${firstName}` : ''}!</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 20px;">Verify your email address</h2>
            <p style="color: #64748b; margin: 0 0 24px 0; line-height: 1.6;">
              To complete your registration and start managing your shared living space, please verify your email address by clicking the button below.
            </p>
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px;">What's next?</h3>
            <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Complete your profile setup</li>
              <li>Create or join a household</li>
              <li>Start managing chores and expenses</li>
              <li>Connect with potential roommates</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 14px;">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This verification link will expire in 24 hours.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, firstName?: string) {
  const resetUrl = `${process.env.REPL_ID ? `https://${process.env.REPL_ID}-00-1epp5col3qtfm.worf.replit.dev` : 'http://localhost:5000'}/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'MyRoommate <noreply@myroommateapp.com>',
      to: [email],
      subject: 'Reset your password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <div style="color: white; font-size: 32px; font-weight: bold;">M</div>
            </div>
            <h1 style="color: #1a1a1a; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin-bottom: 32px;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 20px;">Reset your password${firstName ? `, ${firstName}` : ''}</h2>
            <p style="color: #64748b; margin: 0 0 24px 0; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password for your MyRoommate account.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px;">Security Notice</h3>
            <p style="color: #7f1d1d; margin: 0; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is still secure.
            </p>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 14px;">
            <p>This password reset link will expire in 1 hour for security reasons.</p>
            <p>If you continue to have trouble, please contact our support team.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}