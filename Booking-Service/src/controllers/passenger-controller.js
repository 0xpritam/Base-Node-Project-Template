const { StatusCodes } = require('http-status-codes');
const { PassengerService } = require('../services');
const { SuccessResponse, ErrorResponse } = require('../utils/common');

async function createPassenger(req, res) {
    try {
        const passenger = await PassengerService.createPassenger(req.body);
        SuccessResponse.data = passenger;
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch(error) {
        ErrorResponse.error = error;
        return res
                .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    createPassenger
};
