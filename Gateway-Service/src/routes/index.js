const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ServerConfig } = require('../config');
const { HealthController } = require('../controllers');

const router = express.Router();

router.get('/health', HealthController.getHealth);

// Common hook to propagate request ID to downstream services
const onProxyReq = (proxyReq, req, res) => {
    if (req.requestId) {
        proxyReq.setHeader('x-request-id', req.requestId);
        console.log(`[Proxy Link] Propagating X-Request-ID: ${req.requestId} to downstream ${req.method} ${req.url}`);
    }
};

router.use(createProxyMiddleware({
    pathFilter: '/api/auth',
    target: ServerConfig.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/v1/auth'
    },
    on: {
        proxyReq: onProxyReq
    }
}));

router.use(createProxyMiddleware({
    pathFilter: '/api/bookings',
    target: ServerConfig.BOOKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/bookings': '/api/v1/bookings'
    },
    on: {
        proxyReq: onProxyReq
    }
}));

router.use(createProxyMiddleware({
    pathFilter: '/api/flights',
    target: ServerConfig.FLIGHT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/flights': '/api/v1'
    },
    on: {
        proxyReq: onProxyReq
    }
}));

module.exports = router;
