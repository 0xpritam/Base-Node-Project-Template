const { Op } = require('sequelize');
const db = require('../models');
const { RedisConfig, ServerConfig, Logger } = require('../config');
const BookingService = require('../services/booking-service');

async function subscribeToExpirations(onExpiredCallback) {
    if (RedisConfig.isMock) {
        RedisConfig.redisClient.on('expired', onExpiredCallback);
        Logger.info('[Expiration Worker] Mock Redis subscription active.');
    } else {
        try {
            // Enable keyspace events in Redis
            await RedisConfig.redisClient.configSet('notify-keyspace-events', 'Ex');
            const subscriber = RedisConfig.redisClient.duplicate();
            await subscriber.connect();
            
            await subscriber.subscribe('__keyevent@0__:expired', (key) => {
                onExpiredCallback(key);
            });
            Logger.info('[Expiration Worker] Real Redis keyspace expiration subscription active.');
        } catch(err) {
            Logger.error('[Expiration Worker] Failed to subscribe to keyspace notifications:', { error: err });
        }
    }
}

async function handleExpiration(key) {
    Logger.info(`[Expiration Worker] Expiration event triggered for key: ${key}`);
    
    // Parse key name: e.g. booking:expiry:10
    if (key && key.startsWith('booking:expiry:')) {
        const parts = key.split(':');
        const bookingId = Number(parts[parts.length - 1]);
        
        if (bookingId && !isNaN(bookingId)) {
            Logger.info(`[Expiration Worker] Initiating automatic timeout compensation for Booking ID: ${bookingId}`);
            try {
                await BookingService.cancelBooking(bookingId, 'PAYMENT_TIMEOUT');
            } catch(err) {
                Logger.error(`[Expiration Worker] Failed to cancel expired booking ID ${bookingId}:`, { error: err });
            }
        }
    }
}

async function runRecovery() {
    Logger.info('[Recovery Worker] Scanning for stale PENDING bookings...');
    try {
        const timeoutThreshold = new Date(Date.now() - ServerConfig.BOOKING_TIMEOUT * 1000);
        
        const staleBookings = await db.Booking.findAll({
            where: {
                status: 'PENDING',
                createdAt: {
                    [Op.lt]: timeoutThreshold
                }
            }
        });

        if (staleBookings.length > 0) {
            Logger.info(`[Recovery Worker] Found ${staleBookings.length} stale PENDING bookings older than timeout.`);
            for (const booking of staleBookings) {
                Logger.info(`[Recovery Worker] Auto-compensating stale booking ID: ${booking.id}`);
                try {
                    await BookingService.cancelBooking(booking.id, 'PAYMENT_TIMEOUT');
                } catch(err) {
                    Logger.error(`[Recovery Worker] Recovery failed for booking ID ${booking.id}:`, { error: err });
                }
            }
        }
    } catch(err) {
        Logger.error('[Recovery Worker] Stale bookings scan error:', { error: err });
    }
}

function startWorkers() {
    Logger.info('[Workers Manager] Starting background worker threads...');

    // 1. Expiration Worker subscription
    subscribeToExpirations(handleExpiration);

    // 2. Recovery Worker cron / interval loop (runs every 30 seconds for immediate test feedback)
    setInterval(runRecovery, 30000);
}

module.exports = {
    startWorkers,
    runRecovery
};
