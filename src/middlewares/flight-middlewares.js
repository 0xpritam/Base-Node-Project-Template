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
    if(!req.body.seats) {
        ErrorRespose.message = 'Something went wrong while updating seats';
        ErrorRespose.error = new AppError(['seats not found in the incoming request in the correct form'], StatusCodes.BAD_REQUEST);
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