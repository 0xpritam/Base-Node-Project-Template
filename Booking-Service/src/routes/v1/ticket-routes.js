const express = require('express');
const router = express.Router();
const { TicketController } = require('../../controllers');

router.post('/', TicketController.createTicket);

module.exports = router;
