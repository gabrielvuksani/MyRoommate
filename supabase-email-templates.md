# Supabase Email Templates for myRoommate

This document contains the custom email templates that should be configured in your Supabase project dashboard under Authentication > Email Templates.

## Password Reset Email Template

Navigate to: Supabase Dashboard > Authentication > Email Templates > Reset Password

### Subject Line:
```
Reset your myRoommate password
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset your myRoommate password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            border-radius: 24px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        .logo svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .content {
            margin: 30px 0;
        }
        .content p {
            margin: 16px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #10b981;
            text-decoration: none;
        }
        .security-note {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #0c4a6e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            </div>
            <h1>myRoommate</h1>
            <p class="subtitle">Reset your password</p>
        </div>
        
        <div class="content">
            <p>Hi there!</p>
            
            <p>We received a request to reset your password for your myRoommate account. No worries, it happens to the best of us!</p>
            
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@myroommate.app">support@myroommate.app</a></p>
            <p>This email was sent from myRoommate, your all-in-one roommate management platform.</p>
        </div>
    </div>
</body>
</html>
```

## Welcome Email Template

Navigate to: Supabase Dashboard > Authentication > Email Templates > Confirm Signup

### Subject Line:
```
Welcome to myRoommate! Please confirm your email
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to myRoommate!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            border-radius: 24px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        .logo svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .welcome-message {
            background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
            border: 1px solid #a7f3d0;
            border-radius: 16px;
            padding: 24px;
            margin: 30px 0;
            text-align: center;
        }
        .welcome-message h2 {
            color: #065f46;
            font-size: 24px;
            margin: 0 0 16px 0;
        }
        .features {
            margin: 30px 0;
        }
        .feature {
            display: flex;
            align-items: center;
            margin: 16px 0;
            padding: 16px;
            background: #f8fafc;
            border-radius: 12px;
        }
        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            flex-shrink: 0;
        }
        .feature-icon svg {
            width: 20px;
            height: 20px;
            color: white;
        }
        .feature-text {
            flex: 1;
        }
        .feature-title {
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 4px 0;
        }
        .feature-desc {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
        .content p {
            margin: 16px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #10b981;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            </div>
            <h1>myRoommate</h1>
            <p class="subtitle">Your roommate management platform</p>
        </div>
        
        <div class="welcome-message">
            <h2>🎉 Welcome aboard!</h2>
            <p style="margin: 0; color: #065f46;">You're one step away from transforming your shared living experience.</p>
        </div>
        
        <div class="content">
            <p>Hi there!</p>
            
            <p>We're thrilled to have you join the myRoommate community! Before you can start managing chores, splitting expenses, and finding the perfect roommate matches, please confirm your email address.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm My Email</a>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11V9a3 3 0 0 1 6 0v2"/>
                            <path d="M11 17h2"/>
                            <path d="M5 19a7 7 0 1 1 14 0"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <p class="feature-title">Chore Management</p>
                        <p class="feature-desc">Organize household tasks with smart scheduling and completion tracking</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M2 12h20"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <p class="feature-title">Expense Splitting</p>
                        <p class="feature-desc">Split bills fairly with automatic calculations and payment tracking</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 2v4M16 2v4M21 8.5V13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <p class="feature-title">Roommate Marketplace</p>
                        <p class="feature-desc">Find compatible roommates or list your space with detailed profiles</p>
                    </div>
                </div>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p>Need help getting started? Contact us at <a href="mailto:support@myroommate.app">support@myroommate.app</a></p>
            <p>Welcome to the future of shared living! 🏠</p>
        </div>
    </div>
</body>
</html>
```

## How to Apply These Templates

1. **Login to your Supabase Dashboard**
2. **Navigate to Authentication > Email Templates**
3. **Select "Reset Password" template**
   - Replace the subject with: `Reset your myRoommate password`
   - Replace the HTML body with the Password Reset template above
4. **Select "Confirm Signup" template**
   - Replace the subject with: `Welcome to myRoommate! Please confirm your email`
   - Replace the HTML body with the Welcome template above
5. **Save each template**

## Template Features

### Design Elements
- **Consistent Branding**: Uses myRoommate colors (emerald-cyan gradient)
- **Glass Morphism**: Modern backdrop blur and gradient effects
- **Mobile Responsive**: Optimized for all devices
- **Professional Typography**: Clean, readable fonts

### Security Features
- **Clear CTAs**: Prominent, secure action buttons
- **Link Expiration**: Users are informed about time limits
- **Security Notes**: Warnings about ignoring suspicious emails
- **Alternative Links**: Fallback copy-paste URLs

### Brand Experience
- **Welcome Journey**: Onboarding-focused welcome email
- **Feature Highlights**: Showcases key app capabilities
- **Support Contact**: Clear help and contact information
- **Consistent Voice**: Friendly but professional tone

These templates will provide a premium, branded experience for all authentication emails sent from your myRoommate application.