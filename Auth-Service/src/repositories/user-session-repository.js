const CrudRepository = require('./crud-repository');
const { UserSession } = require('../models');

class UserSessionRepository extends CrudRepository {
    constructor() {
        super(UserSession);
    }

    async createSession(data, transaction = null) {
        return await this.create(data, transaction ? { transaction } : {});
    }

    async revokeSession(token) {
        const [affectedRows] = await UserSession.update(
            { revoked: true },
            { where: { refreshToken: token } }
        );
        return affectedRows > 0;
    }

    async findByRefreshToken(token) {
        return await UserSession.findOne({ where: { refreshToken: token } });
    }
}

module.exports = UserSessionRepository;
