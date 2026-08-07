const { StatusCodes } = require('http-status-codes');
const { FlightService } = require('../services');
const { SuccessResponse, ErrorRespose } = require('../utils/common');
const { log } = require('winston');


async function createFlights(req, res) {

    try {
        const flight = await FlightService.createFlights({
            flightNumber: req.body.flightNumber,
            airplaneId: req.body.airplaneId,
            departureAirportId: req.body.departureAirportId,
            arrivalAirportId: req.body.arrivalAirportId,
            arrivalTime: req.body.arrivalTime,
            departurTime: req.body.departurTime,
            price: req.body.price,
            totalSeats: req.body.totalSeats
        });

        SuccessResponse.data = flight;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
    } catch (error) {
     console.log("controller error => ",error);
     
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json({ ErrorRespose });
    }

}


async function getFlight(req, res) {
    try {
        const flight = await FlightService.getFlight(req.params.id);
        SuccessResponse.data = flight;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
    } catch (error) {
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json({ ErrorRespose });
    }
}


async function updateFlight(req, res) {
    try {
        const flight = await FlightService.updateFlight(req.params.id, req.body);
        SuccessResponse.data = flight;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
    } catch (error) {
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json({ ErrorRespose });
    }
}

async function deleteFlight(req, res) {
    try {
        const flight = await FlightService.destroyFlight(req.params.id);

        SuccessResponse.data = flight;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
    } catch (error) {
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json({ ErrorRespose });
    }
}

async function getAllFlights(req, res) {
    
    try {
        console.log(req.query);
        const flights = await FlightService.getAllFlights(req.query);
        SuccessResponse.data = flights;

        return res
            .status(StatusCodes.OK)
            .json( SuccessResponse );
    } catch (error) {
        console.log(error);
        
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json( ErrorRespose );
    }
}

async function updateSeats(req, res) {
    try {
        console.log(req.body);
        const response = await FlightService.updateSeats({
            flightId: req.params.id,
            seatIds: req.body.seatIds, 
            action: req.body.action,
            bookingId: req.body.bookingId,
            reservedUntil: req.body.reservedUntil
        });
        SuccessResponse.data = response;
        return res
                .status(StatusCodes.OK)
                .json({ SuccessResponse });
    } catch(error) {
        ErrorRespose.error = error;
        return res
                .status(error.StatusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ ErrorRespose });
    }
}

async function getFlightSeats(req, res) {
    try {
        const response = await FlightService.getFlightSeats(req.params.id);
        SuccessResponse.data = response;
        return res
                .status(StatusCodes.OK)
                .json({ SuccessResponse });
    } catch(error) {
        ErrorRespose.error = error;
        return res
                .status(error.StatusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ ErrorRespose });
    }
}

module.exports = {
    createFlights,
    getFlight,
    updateFlight,
    deleteFlight,
    getAllFlights,
    updateSeats,
    getFlightSeats
}