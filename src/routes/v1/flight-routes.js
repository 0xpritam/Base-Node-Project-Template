const express = require('express');
const router = express.Router();
const { FlightController } = require('../../controllers');
const { FlightMiddlewares, IdempotencyMiddlewares, AuthenticateJWT, AuthorizeRoles } = require('../../middlewares');

router.post('/',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    FlightMiddlewares.validatecreateRequest,
    FlightController.createFlights);

router.get('/:id',
    FlightController.getFlight);

router.get('/'
    , FlightController.getAllFlights);

router.delete('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    FlightController.deleteFlight);

router.patch('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    FlightController.updateFlight)

router.patch('/:id/seats',
    IdempotencyMiddlewares.handleIdempotency,
    FlightMiddlewares.validateUpdateSeatsRequest,
    FlightController.updateSeats)

router.get('/:id/seats',
    FlightController.getFlightSeats)

module.exports = router;