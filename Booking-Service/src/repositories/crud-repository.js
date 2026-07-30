const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/errors/app-error');

class CrudRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data, options = {}) {
        const response = await this.model.create(data, options);
        return response;
    }

    async destroy(id) {
        const response = await this.model.destroy({
            where: {
                id: id
            }
        });
        if(!response) {
            throw new AppError('Not able to find the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }

    async get(id) {
        const response = await this.model.findByPk(id);
        if(!response) {
            throw new AppError('Not able to find the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }

    async getAll() {
        const response = await this.model.findAll();
        return response;
    }

    async update(id, data, options = {}) {
        const response = await this.model.update(data, {
            where: {
                id: id
            },
            ...options
        });
        if(response[0] === 0) {
            throw new AppError('Not able to find the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }
}

module.exports = CrudRepository;
