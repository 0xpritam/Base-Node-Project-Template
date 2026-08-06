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
            { 
                revoked: true,
                lastUsedAt: new Date()
            },
            { where: { refreshToken: token } }
        );
        return affectedRows > 0;
    }

    async findByRefreshToken(token) {
        return await UserSession.findOne({ where: { refreshToken: token } });
    }

    async updateRefreshToken(sessionId, newRefreshToken, expiresAt, transaction = null) {
        const [affectedRows] = await UserSession.update(
            { 
                refreshToken: newRefreshToken, 
                expiresAt,
                lastUsedAt: new Date()
            },
            { 
                where: { id: sessionId },
                transaction
            }
        );
        return affectedRows > 0;
    }

    async revokeAllSessions(userId, transaction = null) {
        const [affectedRows] = await UserSession.update(
            { revoked: true },
            { 
                where: { userId },
                transaction
            }
        );
        return affectedRows > 0;
    }
}

module.exports = UserSessionRepository;
