const CrudRepository = require('./crud-repository');
const { User } = require('../models');

class UserRepository extends CrudRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    async findById(id) {
        return await this.get(id);
    }

    async createUser(data, transaction = null) {
        return await this.create(data, transaction ? { transaction } : {});
    }

    async exists(email) {
        const count = await User.count({ where: { email } });
        return count > 0;
    }
}

module.exports = UserRepository;
