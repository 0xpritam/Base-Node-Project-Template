const express = require('express');
const router = express.Router();
const { BookingController } = require('../../controllers');
const { BookingMiddlewares, AuthenticateJWT } = require('../../middlewares');

function overrideUserId(req, res, next) {
    if (req.user && req.user.id) {
        req.body.userId = Number(req.user.id);
    }
    next();
}

router.post('/', AuthenticateJWT, overrideUserId, BookingMiddlewares.validateCreateBookingRequest, BookingController.createBooking);
router.post('/payments', AuthenticateJWT, BookingMiddlewares.validatePaymentRequest, BookingController.makePayment);

module.exports = router;
