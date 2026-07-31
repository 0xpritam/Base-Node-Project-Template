const { UserRepository, RoleRepository, UserSessionRepository } = require('../repositories');
const { sequelize } = require('../models');
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

        const tokenPayload = {
            sub: String(user.id),
            email: user.email,
            roles: roleNames,
            tokenVersion: user.tokenVersion
        };
        const accessToken = jwt.sign(tokenPayload, ServerConfig.JWT_SECRET, {
            expiresIn: ServerConfig.JWT_ACCESS_EXPIRY
        });

        const refreshToken = crypto.randomBytes(32).toString('hex');
        await userSessionRepository.createSession({
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + ServerConfig.JWT_REFRESH_EXPIRY * 1000),
            lastUsedAt: new Date(),
            userAgent: data.userAgent,
            ipAddress: data.ipAddress
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
    }

    async refreshAccessToken(refreshToken) {
        // TODO: Implement refresh token rotation (RTR) logic
        return null;
    }

    async logout(refreshToken) {
        // TODO: Implement session revocation logic
        return null;
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
}

module.exports = UserService;
