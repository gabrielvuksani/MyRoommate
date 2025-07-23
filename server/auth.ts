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
    interface User {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      verified?: boolean;
      phoneNumber?: string;
      dateOfBirth?: Date;
      idVerified?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }
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
    name: "sessionId", // Custom session name for security
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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
          
          // Skip email verification for now
          // if (!user.verified) {
          //   return done(null, false, { message: "Please verify your email address" });
          // }
          
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
        phoneNumber: validatedData.phoneNumber || null,
        dateOfBirth: validatedData.dateOfBirth || null,
        verificationToken,
        verified: true, // Auto-verify for now
        idVerified: false,
        profileImageUrl: null,
      });

      // Auto login after registration
      req.login(user, (err: any) => {
        if (err) return next(err);
        
        // Return JSON for API calls, redirect for browser requests
        if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        } else {
          res.redirect('/');
        }
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
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
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          
          // Return JSON for API calls, redirect for browser requests
          if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
          } else {
            res.redirect('/');
          }
        });
      })(req, res, next);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0].message });
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
      
      // Return JSON for API calls, redirect for browser requests
      if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        res.status(200).json({ message: "Logged out successfully" });
      } else {
        res.redirect('/');
      }
    });
  };

  app.post("/api/logout", handleLogout);
  app.get("/api/logout", handleLogout);

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