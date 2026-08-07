const CrudRepository = require('./crud-repository');
const { UserRole } = require('../models');

class UserRoleRepository extends CrudRepository {
    constructor() {
        super(UserRole);
    }
}

module.exports = UserRoleRepository;
