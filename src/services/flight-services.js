const { StatusCodes } = require('http-status-codes');
const { FlightRepositories, FlightSeatRepository } = require('../repositories');
const AppError = require('../utils/errors/app-errors');
const db = require('../models');
const { compareTime } = require('../utils/helpers/datetime-helpers');
const { Op } = require('sequelize');


const flightRepositories = new FlightRepositories();
const flightSeatRepository = new FlightSeatRepository();

async function createFlights(data) {
    try {

        let timecompare = await compareTime(data.arrivalTime, data.departurTime);
        if (!timecompare) {
            throw new AppError("Arrival time should be greater than departureTime", StatusCodes.BAD_REQUEST);
        }
        const flight = await flightRepositories.create(data);
        return flight;
    } catch (error) {
        console.log("service error => ", error);

        if (error.name == 'AppError') {

            throw error;
        }

        if (error.name == 'SequelizeValidationError') {
            let explanation = [];
            error.errors.forEach((err) => {
                explanation.push(err.message);
            });

            throw new AppError(explanation, StatusCodes.BAD_REQUEST)
        }
        throw new AppError("Cannot fetch data of the flight", StatusCodes.INTERNAL_SERVER_ERROR)
    }
}


async function getFlight(id) {
    try {
        const flight = await flightRepositories.get(id);
        return flight
    } catch (error) {
        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The flight you requested is not present", StatusCodes.BAD_REQUEST);
        }
        throw new AppError("Cannot fetch data of the flight", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function updateFlight(id, data) {
    try {
        const flight = await flightRepositories.update(id, data);
        return flight;
    } catch (error) {
        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The flight you requested is not present", error.StatusCode);

        }
        throw new AppError("Cannot fetch data of the flight", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function destroyFlight(id) {

    try {
        const flight = await flightRepositories.destroy(id);
        return flight;
    } catch (error) {
        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The flight you requested is not present", error.StatusCode);
        }
        throw new AppError("Cannot fetch data of the flight", StatusCodes.INTERNAL_SERVER_ERROR);
    }

}


async function getAllFlights(query) {
    let customFilter = {};
    let sortFilter = [];
    const endingTripTime = " 23:59:00";
    //trip = MUM-DEL
    if (query.trips) {
        const [departureAirportId, arrivalAirportId] = query.trips.split("-");
        customFilter.departureAirportId = departureAirportId;
        customFilter.arrivalAirportId = arrivalAirportId;
        // TODO: add a check that they are not same 

    }

    if (query.price) {
        const [minPrice, maxPrice] = query.price.split("-");

        customFilter.price = {
            [Op.between]: [minPrice, ((maxPrice == undefined) ? 20000 : maxPrice)]
        }
    }

    if (query.totalSeats) {
        customFilter.totalseats = {
            [Op.gte]: query.totalSeats
        }
    }
    if (query.tripDate) {
        customFilter.departurTime = {
            [Op.between]: [query.tripDate, query.tripDate + endingTripTime]
        }
    }
    if (query.sort) {
        const params = query.sort.split(",");
        const sortFilters = params.map((param) => param.split('_'));
        sortFilter = sortFilters;
    }

    try {
        const flights = await flightRepositories.getAllFlights(customFilter, sortFilter);
        return flights;
    } catch (error) {
        console.log(error);

        throw new AppError("Cannot fetch data of all the flights", StatusCodes.INTERNAL_SERVER_ERROR);
    }

}

async function updateSeats(data) {
    const transaction = await db.sequelize.transaction();
    try {
        let response;
        if (data.action === 'RESERVE') {
            response = await flightSeatRepository.reserveSeats(
                data.flightId, 
                data.seatIds, 
                data.bookingId, 
                data.reservedUntil,
                transaction
            );
            await flightRepositories.updateRemainingSeats(data.flightId, data.seatIds.length, true, transaction);
        } else if (data.action === 'RELEASE') {
            response = await flightSeatRepository.releaseSeats(
                data.flightId, 
                data.seatIds,
                data.bookingId,
                transaction
            );
            await flightRepositories.updateRemainingSeats(data.flightId, data.seatIds.length, false, transaction);
        } else if (data.action === 'CONFIRM') {
            response = await flightSeatRepository.confirmSeats(
                data.flightId,
                data.seatIds,
                data.bookingId,
                transaction
            );
        } else {
            throw new AppError('Invalid action specified', StatusCodes.BAD_REQUEST);
        }
        await transaction.commit();
        return response;
    } catch(error) {
        await transaction.rollback();
        console.log(error);
        if (error.name === 'AppError') throw error;
        throw new AppError(error.message || 'Cannot update seats of the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function getFlightSeats(flightId) {
    try {
        const flightSeats = await flightSeatRepository.getFlightSeats(flightId);
        const formattedSeats = flightSeats.map(fs => ({
            seatId: fs.seatId,
            seatNumber: `${fs.seatDetail.row}${fs.seatDetail.col}`,
            seatType: fs.seatDetail.type,
            status: fs.status
        }));
        return formattedSeats;
    } catch(error) {
        console.log(error);
        throw new AppError('Cannot fetch seat map of the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createFlights,
    getFlight,
    updateFlight,
    destroyFlight,
    getAllFlights,
    updateSeats,
    getFlightSeats
}