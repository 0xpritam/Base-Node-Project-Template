const { StatusCodes } = require('http-status-codes');
const HealthService = require('../services/health-service');

async function getHealth(req, res) {
    try {
        const servicesHealth = await HealthService.getAggregatedHealth();
        
        return res.status(StatusCodes.OK).json({
            success: true,
            gateway: {
                status: "UP",
                uptime: process.uptime()
            },
            services: servicesHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fallback for absolute safety (never crash the gateway)
        return res.status(StatusCodes.OK).json({
            success: true,
            gateway: {
                status: "UP",
                uptime: process.uptime()
            },
            services: {
                auth: { status: "DOWN", responseTimeMs: null },
                booking: { status: "DOWN", responseTimeMs: null },
                flight: { status: "DOWN", responseTimeMs: null }
            },
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    getHealth
};
