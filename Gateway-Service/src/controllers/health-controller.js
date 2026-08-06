const { StatusCodes } = require('http-status-codes');

function getHealth(req, res) {
    return res.status(StatusCodes.OK).json({
        success: true,
        service: "API Gateway",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    getHealth
};
