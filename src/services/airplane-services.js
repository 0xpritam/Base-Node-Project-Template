const { StatusCodes } = require("http-status-codes");
const { AirplaneRepositories } = require("../repositories");
const AppError = require("../utils/errors/app-errors");

const airplaneRepositories = new AirplaneRepositories();

async function createAirplane(data) {

    try {

        const airplane = await airplaneRepositories.create(data);
        return airplane;
    } catch (error) {
        // if(error.name == 'TypeError'){
        //     throw new AppError("Cannot creatre a new airplane Object", StatusCodes.INTERNAL_SERVER_ERROR);
        // }
        // throw error;


        if (error.name == 'SequelizeValidationError') {
            let explanation = [];
            error.errors.forEach((err) => {
                explanation.push(err.message);
            });
            console.log(explanation);
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError("Cannot create a new airplane Object", StatusCodes.INTERNAL_SERVER_ERROR);
    }

}

async function getAirplanes() {
    try {
        const airplane = await airplaneRepositories.getAll();
        return airplane;
    } catch (error) {
        throw new AppError("Cannot fetch data of the airplanes", StatusCodes.INTERNAL_SERVER_ERROR);

    }
}

async function getAirplane(id) {


    try {
        const airplane = await airplaneRepositories.get(id);
        return airplane;
    } catch (error) {
        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The airplane you requested is not present", error.StatusCode);
        }
        throw new AppError("Cannot fetch data of the airplanes", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function destroyAirplane(id) {
    try {
        const airplane = await airplaneRepositories.destroy(id);
        return airplane;
    } catch (error) {

        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The airplane you request to delete is bot present", error.StatusCode);
        }
        throw new AppError("Cannot fetch data of the airplane", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function updateAirplane(id, data){
    try {
        const airplane = await airplaneRepositories.update(id, data);
        return airplane;
    } catch (error) {
        if(error.StatusCode == StatusCodes.NOT_FOUND){
            throw new AppError("The airplane you request to update is not present", error.StatusCode);
        }
        throw new AppError("Cannot fetch data of the airplane", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createAirplane,
    getAirplanes,
    getAirplane,
    destroyAirplane,
    updateAirplane
}