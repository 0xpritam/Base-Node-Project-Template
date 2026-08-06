const rateLimit = require('express-rate-limit');
const { ServerConfig } = require('../config');

const limiter = rateLimit({
    windowMs: ServerConfig.RATE_LIMIT_WINDOW_MS,
    max: ServerConfig.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Exclude GET /health from rate limiting
        return req.method === 'GET' && req.path === '/health';
    },
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }
});

module.exports = limiter;
