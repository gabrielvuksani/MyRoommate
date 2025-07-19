import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, loginSchema, registerSchema } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!user.verified) {
            return done(null, false, { message: "Please verify your email address" });
          }
          
          // Don't return password in user object
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword as any);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        done(null, userWithoutPassword as any);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint - support both POST (for app) and GET (for direct browser access)
  const handleRegister = async (req: any, res: any, next: any) => {
    // If it's a direct browser request (GET), redirect to auth page
    if (req.method === 'GET') {
      return res.redirect('/auth');
    }
    
    // Handle POST register
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const verificationToken = nanoid(32);
      
      const user = await storage.createUser({
        id: nanoid(),
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        verificationToken,
        verified: false, // Require email verification
        idVerified: false,
        profileImageUrl: null,
      });

      // Send verification email instead of auto-login
      try {
        const { sendEmail, generateVerificationEmailTemplate } = await import('./email');
        await sendEmail({
          to: user.email,
          subject: 'Verify your email - myRoommate',
          html: generateVerificationEmailTemplate(user.firstName, user.verificationToken!)
        });
        
        res.status(201).json({ 
          message: 'Registration successful! Please check your email to verify your account.',
          requiresVerification: true 
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(201).json({ 
          message: 'Registration successful, but we could not send verification email. Please contact support.',
          requiresVerification: true 
        });
      }
    } catch (error: any) {
      if (error.name === "ZodError") {
        let cleanMessage = error.errors[0].message;
        // Clean up common Zod error patterns to make them more user-friendly
        cleanMessage = cleanMessage
          .replace(/String must contain at least \d+ character\(s\)/gi, 'This field is required')
          .replace(/Invalid email/gi, 'Please enter a valid email address')
          .replace(/The string did not match the expected pattern/gi, 'Password must contain uppercase, lowercase, number, and special character');
        return res.status(400).json({ message: cleanMessage });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  };

  app.post("/api/register", handleRegister);
  app.get("/api/register", handleRegister);

  // Login endpoint - support both POST (for app) and GET (for direct browser access)
  const handleLogin = (req: any, res: any, next: any) => {
    // If it's a direct browser request (GET), redirect to auth page
    if (req.method === 'GET') {
      return res.redirect('/auth');
    }
    
    // Handle POST login
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid email or password" });
        }
        
        // Check if user is verified
        if (!user.verified) {
          return res.status(401).json({ 
            message: "Please verify your email address before signing in"
          });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          res.json(user);
        });
      })(req, res, next);
    } catch (error: any) {
      if (error.name === "ZodError") {
        let cleanMessage = error.errors[0].message;
        // Clean up common Zod error patterns to make them more user-friendly
        cleanMessage = cleanMessage
          .replace(/String must contain at least \d+ character\(s\)/gi, 'This field is required')
          .replace(/Invalid email/gi, 'Please enter a valid email address')
          .replace(/The string did not match the expected pattern/gi, 'Password must contain uppercase, lowercase, number, and special character');
        return res.status(400).json({ message: cleanMessage });
      }
      next(error);
    }
  };

  app.post("/api/login", handleLogin);
  app.get("/api/login", handleLogin);

  // Logout endpoint - support both POST (for app) and GET (for direct browser access)
  const handleLogout = (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      
      // If it's a direct browser request (GET), redirect to landing page
      if (req.method === 'GET') {
        return res.redirect('/');
      }
      
      // For API requests (POST), return JSON
      res.sendStatus(200);
    });
  };

  app.post("/api/logout", handleLogout);
  app.get("/api/logout", handleLogout);

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.redirect('/auth?error=invalid-token');
    }

    try {
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.redirect('/auth?error=invalid-token');
      }

      await storage.verifyUser(user.id);
      return res.redirect('/auth?verified=true');
    } catch (error) {
      console.error('Email verification error:', error);
      return res.redirect('/auth?error=verification-failed');
    }
  });

  // Request password reset
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If an account with that email exists, you will receive a password reset link." });
      }

      const resetToken = nanoid(32);
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);

      const { sendEmail, generatePasswordResetEmailTemplate } = await import('./email');
      await sendEmail({
        to: user.email,
        subject: 'Reset your password - myRoommate',
        html: generatePasswordResetEmailTemplate(user.firstName || 'User', resetToken)
      });

      res.json({ message: "If an account with that email exists, you will receive a password reset link." });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashedPassword);
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};