const { StatusCodes } = require('http-status-codes');
const { ErrorResponse } = require('../utils/common');
const AppError = require('../utils/errors/app-error');

function validateRegisterRequest(req, res, next) {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError('firstName, lastName, email, and password are required fields', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError('Invalid email format', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError(
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number', 
            StatusCodes.BAD_REQUEST
        );
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}

function validateLoginRequest(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError('email and password are required fields', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}

function validateRefreshTokenRequest(req, res, next) {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError('refreshToken is a required string parameter', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}

function validateLogoutRequest(req, res, next) {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
        ErrorResponse.message = 'Validation failed';
        ErrorResponse.error = new AppError('refreshToken is a required string parameter', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}

module.exports = {
    validateRegisterRequest,
    validateLoginRequest,
    validateRefreshTokenRequest,
    validateLogoutRequest
};
