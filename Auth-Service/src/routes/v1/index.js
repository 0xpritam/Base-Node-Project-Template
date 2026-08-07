const express = require('express');
const authRoutes = require('./auth-routes');
const { InfoController } = require('../../controllers');

const router = express.Router();

router.use('/auth', authRoutes);
router.get('/info', InfoController.info);

module.exports = router;
