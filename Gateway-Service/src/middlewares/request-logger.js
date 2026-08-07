const crypto = require('crypto');
const { Logger } = require('../config');

function requestLogger(req, res, next) {
    // 1. Resolve Request ID: Check X-Request-ID (case-insensitive check) or generate new UUID
    const requestId = req.headers['x-request-id'] || req.headers['X-Request-ID'] || crypto.randomUUID();
    req.requestId = requestId;

    // 2. Start high-resolution timer
    const startTime = process.hrtime.bigint();

    // 3. Log on request completion
    res.on('finish', () => {
        const durationNs = process.hrtime.bigint() - startTime;
        const responseTimeMs = Number(durationNs) / 1e6;

        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            responseTimeMs,
            clientIp: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            service: 'Gateway'
        };

        // Log structured JSON
        Logger.info(JSON.stringify(logData));
    });

    next();
}

module.exports = requestLogger;
