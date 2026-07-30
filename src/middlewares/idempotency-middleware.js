const { IdempotencyKey } = require('../models');
const { StatusCodes } = require('http-status-codes');

async function handleIdempotency(req, res, next) {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!idempotencyKey) {
        return next();
    }

    try {
        const existingRecord = await IdempotencyKey.findOne({ where: { key: idempotencyKey } });
        if (existingRecord) {
            if (existingRecord.responseCode) {
                const body = JSON.parse(existingRecord.responseBody);
                return res.status(existingRecord.responseCode).json(body);
            } else {
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: 'A request with this idempotency key is already in progress',
                    data: {},
                    error: { explanation: 'Concurrent request conflict' }
                });
            }
        }

        await IdempotencyKey.create({ key: idempotencyKey });

        const originalJson = res.json;
        res.json = function(body) {
            res.json = originalJson;
            
            IdempotencyKey.update(
                {
                    responseCode: res.statusCode,
                    responseBody: JSON.stringify(body)
                },
                { where: { key: idempotencyKey } }
            ).catch(err => console.error('Error saving idempotency response:', err));

            return originalJson.call(this, body);
        };

        next();
    } catch(error) {
        console.error('Idempotency middleware error:', error);
        next();
    }
}

module.exports = {
    handleIdempotency
};
