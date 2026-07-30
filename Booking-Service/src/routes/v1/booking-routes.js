const express = require('express');
const router = express.Router();
const { BookingController } = require('../../controllers');
const { BookingMiddlewares } = require('../../middlewares');

router.post('/', BookingMiddlewares.validateCreateBookingRequest, BookingController.createBooking);
router.post('/payments', BookingMiddlewares.validatePaymentRequest, BookingController.makePayment);

module.exports = router;
