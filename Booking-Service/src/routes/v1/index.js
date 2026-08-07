const express = require('express');
const router = express.Router();
const { InfoController } = require('../../controllers');

const bookingRoutes = require('./booking-routes');
const passengerRoutes = require('./passenger-routes');
const ticketRoutes = require('./ticket-routes');

router.use('/bookings', bookingRoutes);
router.use('/passengers', passengerRoutes);
router.use('/tickets', ticketRoutes);

router.get('/info', InfoController.info);

module.exports = router;
