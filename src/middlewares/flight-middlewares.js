const AppError = require('../utils/errors/app-errors');
const { StatusCodes } = require("http-status-codes");
const { ErrorRespose } = require('../utils/common');

function validatecreateRequest(req, res, next) {
    if (!req.body.flightNumber) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["FlightNumber not found in the incoming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose })
    }

    if (!req.body.airplaneId) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["airplaneId not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.departureAirportId) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["departureAirportId not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.arrivalAirportId) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["arrivalAirportId not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.arrivalTime) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["arrivalTime not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.departurTime) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["departurTime not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.price) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["price not found in the incomming request"], StatusCodes.BAD_REQUEST);

        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }

    if (!req.body.totalSeats) {
        ErrorRespose.message = "Something went wrong while creating flight";
        ErrorRespose.error = new AppError(["totalSeats not found in the incomming request"], StatusCodes.BAD_REQUEST);
    
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ ErrorRespose });
    }
    next();
}

function validateUpdateSeatsRequest(req, res, next) {
    const { seatIds, action, bookingId } = req.body;
    if(!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        ErrorRespose.message = 'Something went wrong while updating seats';
        ErrorRespose.error = new AppError(['seatIds array not found or empty in the incoming request'], StatusCodes.BAD_REQUEST);
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ ErrorRespose });
    }
    if(!action || !['RESERVE', 'RELEASE', 'CONFIRM'].includes(action)) {
        ErrorRespose.message = 'Something went wrong while updating seats';
        ErrorRespose.error = new AppError(['Action must be either RESERVE, RELEASE or CONFIRM'], StatusCodes.BAD_REQUEST);
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ ErrorRespose });
    }
    if(!bookingId) {
        ErrorRespose.message = 'Something went wrong while updating seats';
        ErrorRespose.error = new AppError(['bookingId is required for this action'], StatusCodes.BAD_REQUEST);
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ ErrorRespose });
    }
    next();
}

module.exports ={
    validatecreateRequest,
    validateUpdateSeatsRequest
}