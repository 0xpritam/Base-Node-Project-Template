const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3005,
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:3001',
    FLIGHT_SERVICE_URL: process.env.FLIGHT_SERVICE_URL || 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    TRUST_PROXY: process.env.TRUST_PROXY === "true",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    CORS_METHODS: process.env.CORS_METHODS || "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === "true"
};
