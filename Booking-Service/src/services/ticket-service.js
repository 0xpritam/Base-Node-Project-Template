const { TicketRepository } = require('../repositories');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

const ticketRepository = new TicketRepository();

async function createTicket(data) {
    try {
        const ticket = await ticketRepository.create(data);
        return ticket;
    } catch(error) {
        throw new AppError('Cannot create ticket', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createTicket
};
