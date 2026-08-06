const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3002,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey123!',
    JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN) || 900,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey123!',
    JWT_REFRESH_EXPIRES_IN: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 604800,
    JWT_ACCESS_EXPIRY: Number(process.env.JWT_EXPIRES_IN) || 900,
    JWT_REFRESH_EXPIRY: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 604800
};
