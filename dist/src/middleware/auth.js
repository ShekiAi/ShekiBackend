"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.expressAuthentication = void 0;
// src/middleware/auth.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const expressAuthentication = async (request, securityName, scopes) => {
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
            const secret = JWT_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Check scopes if needed
            if (scopes && scopes.length > 0) {
                const hasScope = scopes.includes(decoded.role || 'user');
                if (!hasScope) {
                    throw new Error('Insufficient permissions');
                }
            }
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    throw new Error('Unknown security scheme');
};
exports.expressAuthentication = expressAuthentication;
// Helper function to generate JWT token
const generateToken = (payload) => {
    // Ensure secret is a non-empty string
    const secret = JWT_SECRET;
    if (!secret || secret === 'your-super-secret-jwt-key-change-this') {
        console.warn('⚠️ Warning: Using default JWT secret. Please set JWT_SECRET in .env file');
    }
    const options = {
        expiresIn: JWT_EXPIRES_IN
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map