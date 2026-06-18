// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export const expressAuthentication = async (
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<JwtPayload> => {
  if (securityName === 'bearerAuth') {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      // Make sure secret is a string
      const secret = JWT_SECRET as string;
      const decoded = jwt.verify(token, secret) as JwtPayload;
      
      // Check scopes if needed
      if (scopes && scopes.length > 0) {
        const hasScope = scopes.includes(decoded.role || 'user');
        if (!hasScope) {
          throw new Error('Insufficient permissions');
        }
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  throw new Error('Unknown security scheme');
};

// Helper function to generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  // Ensure secret is a non-empty string
  const secret = JWT_SECRET as string;
  
  if (!secret || secret === 'your-super-secret-jwt-key-change-this') {
    console.warn('⚠️ Warning: Using default JWT secret. Please set JWT_SECRET in .env file');
  }
  
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };
  
  return jwt.sign(payload, secret, options);
};