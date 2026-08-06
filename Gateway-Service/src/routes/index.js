const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ServerConfig } = require('../config');
const { HealthController } = require('../controllers');

const router = express.Router();

router.get('/health', HealthController.getHealth);

router.use(createProxyMiddleware({
    pathFilter: '/api/auth',
    target: ServerConfig.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/v1/auth'
    }
}));

router.use(createProxyMiddleware({
    pathFilter: '/api/bookings',
    target: ServerConfig.BOOKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/bookings': '/api/v1/bookings'
    }
}));

router.use(createProxyMiddleware({
    pathFilter: '/api/flights',
    target: ServerConfig.FLIGHT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/flights': '/api/v1'
    }
}));

module.exports = router;
