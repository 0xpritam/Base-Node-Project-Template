const express = require('express');
const router = express.Router();
const { FlightController } = require('../../controllers');
const { FlightMiddlewares } = require('../../middlewares');

router.post('/',
    FlightMiddlewares.validatecreateRequest,
    FlightController.createFlights);

router.get('/:id',
    FlightController.getFlight);

router.get('/'
    , FlightController.getAllFlights);

router.delete('/:id',
    FlightController.deleteFlight);

router.patch('/:id', FlightController.updateFlight)

router.patch('/:id/seats',
    FlightMiddlewares.validateUpdateSeatsRequest,
    FlightController.updateSeats)

module.exports = router;