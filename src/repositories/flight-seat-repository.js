const CrudRepositories = require('./crud-repositories');
const { FlightSeat, Seat } = require('../models');
const db = require('../models');
const AppError = require('../utils/errors/app-errors');
const { StatusCodes } = require('http-status-codes');

class FlightSeatRepository extends CrudRepositories {
    constructor() {
        super(FlightSeat);
    }

    async getFlightSeats(flightId) {
        const response = await FlightSeat.findAll({
            where: { flightId },
            include: [
                {
                    model: Seat,
                    as: 'seatDetail',
                    required: true
                }
            ]
        });
        return response;
    }

    // Private helper: Validate duplicate seat IDs
    _validateUniqueSeats(seatIds, errorMessage) {
        const uniqueSeatIds = new Set(seatIds);
        if (uniqueSeatIds.size !== seatIds.length) {
            throw new AppError(errorMessage, StatusCodes.BAD_REQUEST);
        }
    }

    // Private helper: Retrieve locked FlightSeat records
    async _getLockedFlightSeats(flightId, seatIds, transaction) {
        const flightSeats = await FlightSeat.findAll({
            where: {
                flightId: flightId,
                seatId: seatIds
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (flightSeats.length !== seatIds.length) {
            throw new AppError('Some requested seats do not exist for this flight', StatusCodes.BAD_REQUEST);
        }

        return flightSeats;
    }

    async reserveSeats(flightId, seatIds, bookingId, reservedUntil = null) {
        this._validateUniqueSeats(seatIds, 'Duplicate seat IDs are not allowed in a single reservation request');

        const transaction = await db.sequelize.transaction();
        try {
            const flightSeats = await this._getLockedFlightSeats(flightId, seatIds, transaction);

            // Verify that all requested seats are AVAILABLE
            const unavailableSeats = flightSeats.filter(fs => fs.status !== 'AVAILABLE');
            if (unavailableSeats.length > 0) {
                throw new AppError('Some requested seats are already reserved or held', StatusCodes.BAD_REQUEST);
            }

            // Perform reserve updates
            await FlightSeat.update(
                {
                    status: 'HELD',
                    bookingId: bookingId,
                    reservedUntil: reservedUntil
                },
                {
                    where: {
                        flightId: flightId,
                        seatId: seatIds
                    },
                    transaction
                }
            );

            await transaction.commit();
            return true;
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }

    async releaseSeats(flightId, seatIds, bookingId) {
        this._validateUniqueSeats(seatIds, 'Duplicate seat IDs are not allowed in a single release request');

        const transaction = await db.sequelize.transaction();
        try {
            const flightSeats = await this._getLockedFlightSeats(flightId, seatIds, transaction);

            // Verify that all requested seats belong to the supplied bookingId and are HELD or BOOKED
            for (const fs of flightSeats) {
                if (Number(fs.bookingId) !== Number(bookingId)) {
                    throw new AppError(`Seat ID ${fs.seatId} does not belong to booking ${bookingId}`, StatusCodes.BAD_REQUEST);
                }
                if (fs.status !== 'HELD' && fs.status !== 'BOOKED') {
                    throw new AppError(`Seat ID ${fs.seatId} is not in a releasable state (current status: ${fs.status})`, StatusCodes.BAD_REQUEST);
                }
            }

            // Perform release updates
            await FlightSeat.update(
                {
                    status: 'AVAILABLE',
                    bookingId: null,
                    reservedUntil: null
                },
                {
                    where: {
                        flightId: flightId,
                        seatId: seatIds
                    },
                    transaction
                }
            );

            await transaction.commit();
            return true;
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }

    async confirmSeats(flightId, seatIds, bookingId) {
        this._validateUniqueSeats(seatIds, 'Duplicate seat IDs are not allowed in a single confirmation request');

        const transaction = await db.sequelize.transaction();
        try {
            const flightSeats = await this._getLockedFlightSeats(flightId, seatIds, transaction);

            // Verify that all requested seats belong to the supplied bookingId and are currently HELD
            for (const fs of flightSeats) {
                if (Number(fs.bookingId) !== Number(bookingId)) {
                    throw new AppError(`Seat ID ${fs.seatId} does not belong to booking ${bookingId}`, StatusCodes.BAD_REQUEST);
                }
                if (fs.status !== 'HELD') {
                    throw new AppError(`Seat ID ${fs.seatId} is not currently held (current status: ${fs.status})`, StatusCodes.BAD_REQUEST);
                }
            }

            // Perform confirm updates
            await FlightSeat.update(
                {
                    status: 'BOOKED',
                    reservedUntil: null
                },
                {
                    where: {
                        flightId: flightId,
                        seatId: seatIds
                    },
                    transaction
                }
            );

            await transaction.commit();
            return {
                confirmedSeatsCount: seatIds.length
            };
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = FlightSeatRepository;
