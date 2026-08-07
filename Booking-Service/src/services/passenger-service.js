const { PassengerRepository } = require('../repositories');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

const passengerRepository = new PassengerRepository();

async function createPassenger(data) {
    try {
        const passenger = await passengerRepository.create(data);
        return passenger;
    } catch(error) {
        throw new AppError('Cannot create passenger', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createPassenger
};
