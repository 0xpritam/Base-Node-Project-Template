const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3002,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey123!',
    JWT_ACCESS_EXPIRY: Number(process.env.JWT_ACCESS_EXPIRY) || 900,
    JWT_REFRESH_EXPIRY: Number(process.env.JWT_REFRESH_EXPIRY) || 604800
};
