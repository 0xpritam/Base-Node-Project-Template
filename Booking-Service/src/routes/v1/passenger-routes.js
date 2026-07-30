const express = require('express');
const router = express.Router();
const { PassengerController } = require('../../controllers');

router.post('/', PassengerController.createPassenger);

module.exports = router;
