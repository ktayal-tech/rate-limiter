import { Request, Response } from "express";
import { authenticateToken } from "./authenticate-token";
import { SlidingWindowRateLimiter } from "../classes/sliding-window-rate-limiter";
import { IRateLimiter } from "../interfaces/rate-limiter";

/**
 * Middleware for rate limiting requests using sliding window algorithm.
 *
 * This middleware:
 * 1. Attempts to authenticate the user (optional, falls back gracefully)
 * 2. Generates a unique rate limit key based on user ID or IP address
 * 3. Checks if the request should be allowed based on the configured limits
 * 4. Sets appropriate HTTP response headers for rate limit information
 * 5. Returns 429 status if rate limit is exceeded
 *
 * Rate limit configuration is controlled by environment variables:
 * - REQUESTS_LIMIT_PER_WINDOW: Maximum requests per window (default: 10)
 * - RATE_LIMIT_WINDOW_MS: Window size in seconds (default: 60)
 * - ALLOW_REQUESTS_IF_REDIS_DOWN: Fallback behavior when Redis is unavailable
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to continue middleware chain
 * @returns void - Calls next() if allowed, or sends 429 response if rate limited
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { rateLimiter } from './middlewares/rate-limiter';
 *
 * const app = express();
 * app.use(rateLimiter); // Apply to all routes
 * ```
 */
export const rateLimiter = async (
	req: Request,
	res: Response,
	next: Function
) => {
	let userId: number | undefined = undefined;
	try {
		await authenticateToken(req, res, next);
		// if authenticated user got user in req.user, user information can be used for determining rate limit parameters on the basis of user type such as free or premium.
	} catch (error) {}
	userId = req.user?.id;
	const ipAddress: string = req.ip!;

	const limiter: IRateLimiter = new SlidingWindowRateLimiter(
		Number(process.env.REQUESTS_LIMIT_PER_WINDOW || 10),
		Number(process.env.RATE_LIMIT_WINDOW_MS || 60)
	);
	const rateLimitKey: string = limiter.generateKey(userId, ipAddress);
	const isAllowed = limiter.shouldProceed(rateLimitKey);
    const remainingRequests = limiter.getRemainingRequestsQuota(rateLimitKey);
    const rateLimit = limiter.getRateLimit();
    res.header("X-RateLimit-Limit", rateLimit.toString());
    res.header("X-RateLimit-Remaining", remainingRequests.toString());
	if (!isAllowed) {
		return res
			.status(429)
			.json({ message: "Too many requests, please try again later." });
	}
	next();
};