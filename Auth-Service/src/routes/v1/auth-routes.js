const express = require('express');
const { UserController } = require('../../controllers');
const { AuthMiddlewares, Gatekeeper } = require('../../middlewares');

const router = express.Router();

router.post('/register', AuthMiddlewares.validateRegisterRequest, UserController.register);
router.post('/login', AuthMiddlewares.validateLoginRequest, UserController.login);
router.post('/refresh', AuthMiddlewares.validateRefreshTokenRequest, UserController.refresh);
router.post('/logout', AuthMiddlewares.validateLogoutRequest, UserController.logout);
router.get('/me', Gatekeeper.authenticateJWT, UserController.getMe);
router.patch('/me', UserController.updateProfile);
router.post('/change-password', UserController.changePassword);
router.post('/roles/assign', UserController.assignRole);

module.exports = router;
