import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const secretKey: string = process.env.JWT_SECRET!;

/**
 * Middleware for JWT token authentication.
 *
 * This middleware:
 * 1. Extracts the JWT token from the Authorization header (Bearer format)
 * 2. Validates the token format and presence
 * 3. Checks if the token is blacklisted (placeholder for future implementation)
 * 4. Verifies the token signature and expiration using JWT_SECRET
 * 5. Attaches decoded user information to req.user if valid
 *
 * Expected header format: "Authorization: Bearer <token>"
 *
 * @param req - Express request object (will have req.user attached if authenticated)
 * @param res - Express response object
 * @param next - Express next function to continue middleware chain
 * @returns void - Calls next() if authenticated, or sends error response (401/403)
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { authenticateToken } from './middlewares/authenticate-token';
 *
 * const app = express();
 * app.use(authenticateToken); // Require authentication for all routes
 * app.get('/protected', (req, res) => {
 *   // req.user contains decoded JWT payload
 *   res.json({ user: req.user });
 * });
 * ```
 */
export const authenticateToken = async (
	req: Request,
	res: Response,
	next: Function
) => {
	const authHeader = req.headers["authorization"];
	const token: string | undefined = authHeader?.split(" ")[1];

	if (!token) {
		return res
			.status(401)
			.json({ message: "Authentication required, Token missing" });
	}
	const isTokenBlackListed = false; // Logic can be implemented to check if the token is blacklisted
	if (!isTokenBlackListed) {
		return res
			.status(401)
			.json({ message: "Authentication required, Token is blacklisted" });
	}
	jwt.verify(token, secretKey, (err, decoded) => {
		if (err) {
			return res.status(403).json({ message: "Invalid or expired token" }); // 403 Forbidden
		}
		req.user = decoded;
		next(); // Proceed to the next middleware or route handler
	});
};