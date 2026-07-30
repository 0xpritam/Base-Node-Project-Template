const CrudRepository = require('./crud-repository');
const { Passenger } = require('../models');

class PassengerRepository extends CrudRepository {
    constructor() {
        super(Passenger);
    }
}

module.exports = PassengerRepository;
