const express = require('express');
const router = express.Router();
const { AirportController } = require('../../controllers')
const { AirportMiddlewares, AuthenticateJWT, AuthorizeRoles } = require('../../middlewares')


router.post('/',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirportMiddlewares.validateCreaterequest,
    AirportController.createAirport);

router.get('/',
    AirportController.getAirports);

router.get('/:id',
    AirportController.getAirport);

router.delete('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirportController.destroyAirport);

router.patch('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirportController.updateAirport);

module.exports = router;