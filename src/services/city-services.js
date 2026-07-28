const { StatusCodes } = require("http-status-codes");
const { CityRepositories } = require("../repositories");
const AppError = require("../utils/errors/app-errors");
const { SuccessResponse, ErrorRespose } = require("../utils/common");


const cityRepositories = new CityRepositories();

async function createCity(data) {

    try {
        const city = await cityRepositories.create(data);
        return city;
    } catch (error) {

        if (error.name == "SequelizeValidationError" || error.name == "SequelizeUniqueConstraintError") {
            let explanetion = [];
            error.errors.forEach((err) => {
                explanetion.push(err.message);
            });
            throw new AppError(explanetion, StatusCodes.NOT_FOUND);
        }
        throw new AppError("Cannot create a new city object", StatusCodes.INTERNAL_SERVER_ERROR);
    }

}


// async function getCitys() {
//     try {
//         const city = await cityRepositories.getAll();
//         return city;
//     } catch (error) {
//         throw new AppError("Cannot fetch data of the airplanes", StatusCodes.INTERNAL_SERVER_ERROR);
//     }
// }

async function destroyCity(id) {
    try {
        const city = await cityRepositories.destroy(id);
        return city;
    } catch (error) {
        if (error.StatusCode == StatusCodes.NOT_FOUND) {
            throw new AppError("The city you requested to delete is not present", error.StatusCode);
        }
        throw new AppError("Cannot fetch data of the city", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function updateCity(id, data) {
    try {
        const city = await cityRepositories.update(id, data);
        return city;
    } catch (error) {
        if (error.StatusCode === StatusCodes.NOT_FOUND) {
            throw new AppError("The city you request to update is not present", error.StatusCode);

        }

        throw new AppError("Can't fetch data of the city", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createCity,
    destroyCity,
    updateCity
}