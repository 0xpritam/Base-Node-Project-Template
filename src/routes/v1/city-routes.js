const express = require('express');
const router = express.Router();

const { CityController } = require("../../controllers");
const { CityMiddlewares, AuthenticateJWT, AuthorizeRoles } = require("../../middlewares")

router.post('/',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    CityMiddlewares.validatecreateRequest,
    CityController.createCity);

router.delete('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    CityController.deleteCity);

router.patch('/:id',
    AuthenticateJWT,
    AuthorizeRoles('ADMIN', 'AIRLINE_ADMIN'),
    CityController.updateCity);

module.exports = router;