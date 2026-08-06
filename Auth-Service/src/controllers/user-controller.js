const { StatusCodes } = require('http-status-codes');
const { SuccessResponse, ErrorResponse } = require('../utils/common');
const AppError = require('../utils/errors/app-error');
const { UserService } = require('../services');

const userService = new UserService();

async function register(req, res) {
    try {
        const response = await userService.registerUser({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            phoneNumber: req.body.phoneNumber
        });
        SuccessResponse.message = 'Successfully registered the user';
        SuccessResponse.data = response;
        return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.message = 'User registration failed';
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function login(req, res) {
    try {
        const response = await userService.signin({
            email: req.body.email,
            password: req.body.password,
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent']
        });
        SuccessResponse.message = 'Successfully authenticated the user';
        SuccessResponse.data = response;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.message = 'Authentication failed';
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function refresh(req, res) {
    try {
        const response = await userService.refreshAccessToken(req.body.refreshToken);
        SuccessResponse.message = 'Successfully generated new access token';
        SuccessResponse.data = response;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.message = 'Token refresh failed';
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function logout(req, res) {
    try {
        const response = await userService.logout(req.body.refreshToken);
        SuccessResponse.message = 'Successfully logged out user and revoked session';
        SuccessResponse.data = response;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.message = 'Logout failed';
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function getMe(req, res) {
    try {
        const userId = req.user.sub;
        const userDetails = await userService.getUserById(userId);
        SuccessResponse.message = 'Successfully fetched user profile details';
        SuccessResponse.data = userDetails;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.message = 'Failed to fetch user profile';
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function updateProfile(req, res) {
    // TODO: Implement profile update
    SuccessResponse.message = 'UpdateProfile endpoint placeholder';
    return res.status(StatusCodes.NOT_IMPLEMENTED).json(SuccessResponse);
}

async function changePassword(req, res) {
    // TODO: Implement change password
    SuccessResponse.message = 'ChangePassword endpoint placeholder';
    return res.status(StatusCodes.NOT_IMPLEMENTED).json(SuccessResponse);
}

async function assignRole(req, res) {
    // TODO: Implement role assignment
    SuccessResponse.message = 'AssignRole endpoint placeholder';
    return res.status(StatusCodes.NOT_IMPLEMENTED).json(SuccessResponse);
}

module.exports = {
    register,
    login,
    refresh,
    logout,
    getMe,
    updateProfile,
    changePassword,
    assignRole
};
