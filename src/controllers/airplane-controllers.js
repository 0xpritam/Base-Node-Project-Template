const { StatusCodes } = require('http-status-codes');
const { AirplaneService } = require('../services');
const { SuccessResponse, ErrorRespose } = require("../utils/common");

/**
 *PORT: /airplanes,
 req.body{modelNumber: airbus320, capacity: 200} 
 *
 */



async function createAirplane(req, res) {

    console.log("Inside controller");

    try {
        const airplane = await AirplaneService.createAirplane({
            modelNumber: req.body.modelNumber,
            capacity: req.body.capacity
        });
        SuccessResponse.data = airplane;
        return res
            .status(StatusCodes.CREATED)
            .json({ SuccessResponse });

    } catch (error) {

        ErrorRespose.error = error;
        return res
            .status(error.StatusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ ErrorRespose });
    }
}

async function getAirplanes(req, res) {
    try {
        const airplane = await AirplaneService.getAirplanes();
        SuccessResponse.data = airplane;
        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });

    } catch (error) {

        ErrorRespose.error = error;
        return res
            .status(error.StatusCode)
            .json({ ErrorRespose })
    }
}

async function getAirplane(req, res) {
    try {
        const Airplane = await AirplaneService.getAirplane(req.params.id);
        SuccessResponse.data = Airplane;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
    } catch (error) {
        ErrorRespose.error = error;
        return res
            .status(error.StatusCode)
            .json({ ErrorRespose })
    }
}


async function deleteAirplane(req, res) {
    try {
        const airplane = await AirplaneService.destroyAirplane(req.params.id);
        SuccessResponse.data = airplane;

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

async function updateAirplane(req, res) {
    try {
        const airplane = await AirplaneService.updateAirplane(req.params.id , req.body);
        SuccessResponse.data = airplane;

        return res
            .status(StatusCodes.OK)
            .json({ SuccessResponse });
            
    } catch (error) {
        ErrorRespose.error = error;

        return res
            .status(error.StatusCode)
            .json({ ErrorRespose })
    }
}
module.exports = {
    createAirplane,
    getAirplanes,
    getAirplane,
    deleteAirplane,
    updateAirplane
}