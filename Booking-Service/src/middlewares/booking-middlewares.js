const { StatusCodes } = require('http-status-codes');
const { ErrorResponse } = require('../utils/common');
const AppError = require('../utils/errors/app-error');

function validateCreateBookingRequest(req, res, next) {
    const { flightId, userId, seatIds } = req.body;

    if (!flightId || isNaN(flightId)) {
        ErrorResponse.message = 'Something went wrong while initiating booking';
        ErrorResponse.error = new AppError(['flightId must be a valid number'], StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if (!userId || isNaN(userId)) {
        ErrorResponse.message = 'Something went wrong while initiating booking';
        ErrorResponse.error = new AppError(['userId must be a valid number'], StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        ErrorResponse.message = 'Something went wrong while initiating booking';
        ErrorResponse.error = new AppError(['seatIds must be a non-empty array'], StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    next();
}

function validatePaymentRequest(req, res, next) {
    const { bookingId, status } = req.body;

    if (!bookingId || isNaN(bookingId)) {
        ErrorResponse.message = 'Something went wrong while processing payment';
        ErrorResponse.error = new AppError(['bookingId must be a valid number'], StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if (!status || !['SUCCESS', 'FAILED'].includes(status)) {
        ErrorResponse.message = 'Something went wrong while processing payment';
        ErrorResponse.error = new AppError(['status must be either SUCCESS or FAILED'], StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    next();
}

module.exports = {
    validateCreateBookingRequest,
    validatePaymentRequest
};
