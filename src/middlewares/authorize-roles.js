const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/errors/app-errors');
const { ErrorResponse } = require('../utils/common');

/**
 * Middleware to authorize users based on their roles.
 * Must execute after authenticateJWT.
 *
 * @param {...string} allowedRoles - List of roles permitted to access the resource.
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            ErrorResponse.message = 'Authorization failed';
            ErrorResponse.error = new AppError('User authentication details missing. JWT authentication must be executed first.', StatusCodes.UNAUTHORIZED);
            return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
        }

        const userRoles = req.user.roles || [];
        const hasRole = userRoles.some(role => allowedRoles.includes(role));

        if (!hasRole) {
            ErrorResponse.message = 'Authorization failed';
            ErrorResponse.error = new AppError('Unauthorized access: Insufficient privileges to access this resource.', StatusCodes.FORBIDDEN);
            return res.status(StatusCodes.FORBIDDEN).json(ErrorResponse);
        }

        next();
    };
}

module.exports = authorizeRoles;
