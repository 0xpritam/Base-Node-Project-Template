const { UserRepository, RoleRepository, UserSessionRepository } = require('../repositories');
const { sequelize, UserSession } = require('../models');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ServerConfig } = require('../config');

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const userSessionRepository = new UserSessionRepository();

class UserService {
    async registerUser(data) {
        const transaction = await sequelize.transaction();
        try {
            const alreadyExists = await userRepository.exists(data.email);
            if (alreadyExists) {
                throw new AppError('An account with this email address already exists', StatusCodes.BAD_REQUEST);
            }

            const user = await userRepository.createUser(data, transaction);

            const customerRole = await roleRepository.findByName('CUSTOMER');
            if (!customerRole) {
                throw new AppError('Default CUSTOMER role not found in system', StatusCodes.INTERNAL_SERVER_ERROR);
            }

            await user.addRole(customerRole, { transaction });

            await transaction.commit();

            const tokenPayload = {
                sub: String(user.id),
                email: user.email,
                roles: ['CUSTOMER'],
                tokenVersion: user.tokenVersion
            };
            const accessToken = jwt.sign(tokenPayload, ServerConfig.JWT_SECRET, {
                expiresIn: ServerConfig.JWT_ACCESS_EXPIRY
            });

            const userResponse = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            return {
                user: userResponse,
                accessToken
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async signin(data) {
        const user = await userRepository.findByEmail(data.email);
        if (!user) {
            throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
        }

        if (user.status !== 'ACTIVE') {
            throw new AppError('Your account is blocked or deactivated', StatusCodes.FORBIDDEN);
        }

        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
        }

               const roles = await user.getRoles();
        const roleNames = roles.map(r => r.name);

        const accessToken = await this.generateAccessToken(user);

        const tempToken = crypto.randomBytes(32).toString('hex');
        const session = await userSessionRepository.createSession({
            userId: user.id,
            refreshToken: tempToken,
            expiresAt: new Date(Date.now() + ServerConfig.JWT_REFRESH_EXPIRES_IN * 1000),
            lastUsedAt: new Date(),
            userAgent: data.userAgent,
            ipAddress: data.ipAddress
        });

        const refreshToken = await this.generateRefreshToken(user, session.id);
        await userSessionRepository.updateRefreshToken(session.id, refreshToken, session.expiresAt);

        const userResponse = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        return {
            user: userResponse,
            accessToken,
            refreshToken
        };
    }

    async refreshAccessToken(refreshToken) {
        let decoded;
        try {
            decoded = await this.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError(error.explanation || 'Invalid refresh token', StatusCodes.UNAUTHORIZED);
        }

        const session = await UserSession.findByPk(Number(decoded.sessionId));
        if (!session) {
            throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
        }

        if (session.refreshToken !== refreshToken) {
            session.revoked = true;
            await session.save();
            throw new AppError('Refresh token already rotated', StatusCodes.UNAUTHORIZED);
        }

        if (session.revoked) {
            throw new AppError('Session revoked', StatusCodes.UNAUTHORIZED);
        }

        if (new Date(session.expiresAt) < new Date()) {
            throw new AppError('Expired refresh token', StatusCodes.UNAUTHORIZED);
        }

        const user = await userRepository.findById(session.userId);
        if (!user) {
            throw new AppError('User not found', StatusCodes.UNAUTHORIZED);
        }

        if (user.status === 'BLOCKED') {
            throw new AppError('Your account is blocked', StatusCodes.FORBIDDEN);
        }
        if (user.status === 'DELETED') {
            throw new AppError('Your account is deactivated', StatusCodes.FORBIDDEN);
        }

        const accessToken = await this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(user, session.id);
        const newExpiresAt = new Date(Date.now() + ServerConfig.JWT_REFRESH_EXPIRES_IN * 1000);

        await userSessionRepository.updateRefreshToken(session.id, newRefreshToken, newExpiresAt);

        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    }

    async logout(refreshToken) {
        let decoded;
        try {
            decoded = await this.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError(error.explanation || 'Invalid refresh token', StatusCodes.UNAUTHORIZED);
        }

        const session = await userSessionRepository.findByRefreshToken(refreshToken);
        if (!session) {
            throw new AppError('Session not found', StatusCodes.UNAUTHORIZED);
        }

        if (session.revoked) {
            throw new AppError('Session already revoked', StatusCodes.UNAUTHORIZED);
        }

        await userSessionRepository.revokeSession(refreshToken);

        return {
            success: true
        };
    }

    async getUserById(userId) {
        const user = await userRepository.findById(userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new AppError('User not found or account is deactivated', StatusCodes.NOT_FOUND);
        }
        const roles = await user.getRoles();
        const roleNames = roles.map(r => r.name);
        
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            roles: roleNames,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    async updateProfile(userId, data) {
        // TODO: Implement updateProfile details
        return null;
    }

    async changePassword(userId, data) {
        // TODO: Implement changePassword update logic
        return null;
    }

    async assignRole(userId, roleName) {
        // TODO: Implement role assignment logic
        return null;
    }

    async generateAccessToken(user) {
        const roles = await user.getRoles();
        const roleNames = roles.map(r => r.name);
        const tokenPayload = {
            sub: String(user.id),
            email: user.email,
            roles: roleNames,
            tokenVersion: user.tokenVersion
        };
        return jwt.sign(tokenPayload, ServerConfig.JWT_SECRET, {
            expiresIn: ServerConfig.JWT_EXPIRES_IN
        });
    }

    async generateRefreshToken(user, sessionId) {
        const tokenPayload = {
            sub: String(user.id),
            sessionId: String(sessionId),
            tokenVersion: user.tokenVersion
        };
        return jwt.sign(tokenPayload, ServerConfig.JWT_REFRESH_SECRET, {
            expiresIn: ServerConfig.JWT_REFRESH_EXPIRES_IN
        });
    }

    async verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, ServerConfig.JWT_REFRESH_SECRET);
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Refresh token has expired', StatusCodes.UNAUTHORIZED);
            }
            throw new AppError('Invalid refresh token signature', StatusCodes.UNAUTHORIZED);
        }
    }
}

module.exports = UserService;
