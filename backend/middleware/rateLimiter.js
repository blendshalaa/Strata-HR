/**
 * Rate Limiting Middleware
 * Protects auth endpoints from brute force and AI endpoints from cost abuse.
 */
const rateLimit = require('express-rate-limit');

// Pre-configured limiters using express-rate-limit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 15,                      // 15 attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 30,                      // 30 AI requests per hour
    message: { error: 'AI request limit reached. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 200,                     // 200 requests per window
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, aiLimiter, generalLimiter };
