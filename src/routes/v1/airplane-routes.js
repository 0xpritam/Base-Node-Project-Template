const express = require('express');
const router = express.Router();

const { AirplaneController } = require("../../controllers");
const { AirplainMiddlewares, AuthenticateJWT, AuthorizeRoles } = require('../../middlewares');

console.log("Inside airplanes routes");

// /api/v1/airplanes POST
router.post('/',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirplainMiddlewares.ValidateCreateRequest,
    AirplaneController.createAirplane);

// /api/v1/airplanes GET
router.get('/',
    AirplaneController.getAirplanes);

// /api/v1/airplanes/:id GET
router.get('/:id',
    AirplaneController.getAirplane);

// /api/v1/airplanes/:id DELETE
router.delete('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirplaneController.deleteAirplane);

// /api/v1/airplanes/:id PATCH
router.patch('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    AirplaneController.updateAirplane);

module.exports = router;