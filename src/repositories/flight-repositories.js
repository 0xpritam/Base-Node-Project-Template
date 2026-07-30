const CrudRepositories = require('./crud-repositories');
const { Sequelize } = require('sequelize');
const { Flight, Airplane, Airport, City, Seat, FlightSeat } = require('../models');
const db = require('../models');
const { addRowLockOnFlights } = require('./queries');

class flightsRepositories extends CrudRepositories {
    constructor() {
        super(Flight);
    }

    async create(data) {
        const transaction = await db.sequelize.transaction();
        try {
            const flight = await Flight.create(data, { transaction });

            const seats = await Seat.findAll({
                where: {
                    airplaneId: data.airplaneId
                }
            });

            const flightSeatsPayload = seats.map(seat => ({
                flightId: flight.id,
                seatId: seat.id,
                status: 'AVAILABLE',
                bookingId: null,
                reservedUntil: null
            }));

            await FlightSeat.bulkCreate(flightSeatsPayload, { transaction });

            await transaction.commit();
            return flight;
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getAllFlights(filter, sort) {
        const response = await Flight.findAll({
            where: filter,
            order: sort,
            include: [
                {
                    model: Airplane,
                    required: true,
                    as: 'airplanedetail'
                },
                {
                    model: Airport,
                    required: true,
                    as: 'departureAirport',
                    on: {
                        col1: Sequelize.where(Sequelize.col("Flight.departureAirportId"), "=", Sequelize.col("departureAirport.code"))
                    },
                    include: {
                        model: City,
                        required: true
                    }
                },

                {
                    model: Airport,
                    required: true,
                    as: 'arrivalAirport',
                    on: {
                        col1: Sequelize.where(Sequelize.col("Flight.arrivalAirportId"), "=", Sequelize.col("arrivalAirport.code"))
                    },
                    include: {
                        model: City,
                        required: true
                    }
                }
            ]
        })
        return response;
    }

    async updateRemainingSeats(flightId, seats, dec = true, transaction = null) {
        const localTransaction = transaction || await db.sequelize.transaction();
        try {
            // Native row lock inside the correct transaction boundary
            const flight = await Flight.findByPk(flightId, {
                transaction: localTransaction,
                lock: localTransaction.LOCK.UPDATE
            });
            if (!flight) {
                throw new Error('Flight not found');
            }

            if(+dec) {
                await flight.decrement('totalSeats', { by: seats, transaction: localTransaction });
            } else {
                await flight.increment('totalSeats', { by: seats, transaction: localTransaction });
            }

            if (!transaction) {
                await localTransaction.commit();
            }
            return flight;
        } catch(error) {
            if (!transaction) {
                await localTransaction.rollback();
            }
            throw error;
        }
    }
}

module.exports = flightsRepositories;