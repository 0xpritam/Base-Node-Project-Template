const { StatusCodes } =  require("http-status-codes");
const { ErrorRespose } = require("../utils/common");
const AppError = require("../utils/errors/app-errors");


function validatecreateRequest(req, res, next){
    if(!req.body?.name){
     
        ErrorRespose.message = "Something went wrong while creating city";
        ErrorRespose.error = new AppError(["City name not found in the incoming request "], StatusCodes.BAD_REQUEST);

        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ ErrorRespose });
    }
  next();
}

module.exports = {
    validatecreateRequest
};