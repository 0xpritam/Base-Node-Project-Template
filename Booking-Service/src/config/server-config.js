const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3001,
    FLIGHT_SERVICE_PATH: process.env.FLIGHT_SERVICE_PATH,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    USE_MOCK_REDIS: process.env.USE_MOCK_REDIS,
    BOOKING_TIMEOUT: Number(process.env.BOOKING_TIMEOUT) || 600,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey123!'
};
