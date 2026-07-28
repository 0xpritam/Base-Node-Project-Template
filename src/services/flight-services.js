const { StatusCodes } = require('http-status-codes');
const { FlightRepositories } = require('../repositories');
const AppError = require('../utils/errors/app-errors');
const { compareTime } = require('../utils/helpers/datetime-helpers');
const { Op } = require('sequelize');


const flightRepositories = new FlightRepositories();

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
    try {
        const response = await flightRepositories.updateRemainingSeats(data.flightId, data.seats, data.dec);
        return response;
    } catch(error) {
        console.log(error);
        throw new AppError('Cannot update data of the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createFlights,
    getFlight,
    updateFlight,
    destroyFlight,
    getAllFlights,
    updateSeats
}