import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        aud: string;
        role?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {}

// Middleware to verify Supabase JWT tokens
export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      aud: user.aud,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Optional middleware - allows both authenticated and unauthenticated requests
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          aud: user.aud,
          role: user.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};