const CrudRepository = require('./crud-repository');
const { Ticket } = require('../models');

class TicketRepository extends CrudRepository {
    constructor() {
        super(Ticket);
    }
}

module.exports = TicketRepository;
