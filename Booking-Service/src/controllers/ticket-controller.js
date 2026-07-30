const { StatusCodes } = require('http-status-codes');
const { TicketService } = require('../services');
const { SuccessResponse, ErrorResponse } = require('../utils/common');

async function createTicket(req, res) {
    try {
        const ticket = await TicketService.createTicket(req.body);
        SuccessResponse.data = ticket;
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
    createTicket
};
