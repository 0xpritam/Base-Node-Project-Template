const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const ServerConfig = require('../config/server-config');
const AppError = require('../utils/errors/app-errors');
const { ErrorResponse } = require('../utils/common');

function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new AppError('Missing Authorization header', StatusCodes.UNAUTHORIZED);
        }
        if (!authHeader.startsWith('Bearer ')) {
            throw new AppError('Invalid Bearer token format', StatusCodes.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, ServerConfig.JWT_SECRET);
        
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            roles: decoded.roles || [],
            tokenVersion: decoded.tokenVersion
        };
        next();
    } catch (error) {
        ErrorResponse.message = 'Authentication failed';
        if (error.name === 'TokenExpiredError') {
            ErrorResponse.error = new AppError('Expired JWT token', StatusCodes.UNAUTHORIZED);
        } else if (error instanceof AppError) {
            ErrorResponse.error = error;
        } else {
            ErrorResponse.error = new AppError('Invalid JWT token', StatusCodes.UNAUTHORIZED);
        }
        return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
    }
}

module.exports = authenticateJWT;
