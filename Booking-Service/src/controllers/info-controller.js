const { StatusCodes } = require('http-status-codes');
const { RedisConfig } = require('../config');

const info = (req, res) => {
    const isRedisConnected = RedisConfig.redisClient.isOpen;
    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Booking API is live',
        error: {},
        data: {
            redis: isRedisConnected ? 'UP' : 'DOWN'
        },
    });
}

module.exports = {
    info
};
