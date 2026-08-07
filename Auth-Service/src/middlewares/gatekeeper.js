const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { ServerConfig } = require('../config');
const AppError = require('../utils/errors/app-error');
const { ErrorResponse } = require('../utils/common');

function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('JWT token is missing or malformed', StatusCodes.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, ServerConfig.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        ErrorResponse.message = 'Authentication failed';
        if (error.name === 'TokenExpiredError') {
            ErrorResponse.error = new AppError('JWT token has expired', StatusCodes.UNAUTHORIZED);
        } else if (error instanceof AppError) {
            ErrorResponse.error = error;
        } else {
            ErrorResponse.error = new AppError('Invalid JWT signature or token', StatusCodes.UNAUTHORIZED);
        }
        return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
    }
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const userRoles = req.user.roles || [];
        const hasAccess = userRoles.some(role => allowedRoles.includes(role));
        if (!hasAccess) {
            ErrorResponse.message = 'Unauthorized access';
            ErrorResponse.error = new AppError('You do not have permission to access this resource', StatusCodes.FORBIDDEN);
            return res.status(StatusCodes.FORBIDDEN).json(ErrorResponse);
        }
        next();
    };
}

module.exports = {
    authenticateJWT,
    authorizeRoles
};
