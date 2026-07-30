const { BookingRepository } = require('../repositories');
const FlightServiceClient = require('./flight-service-client');
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');
const { RedisConfig, ServerConfig } = require('../config');

const bookingRepository = new BookingRepository();

function generatePNR() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function createBooking(data) {
    const transaction = await db.sequelize.transaction();
    let booking;
    
    try {
        const { flightId, userId, seatIds, passengers } = data;

        // 1. Fetch flight details from Flight Service
        const flight = await FlightServiceClient.getFlightDetails(flightId);

        // 2. Check if enough seats are remaining
        if (flight.totalSeats < seatIds.length) {
            throw new AppError('Not enough seats remaining on the requested flight', StatusCodes.BAD_REQUEST);
        }

        // 3. Prepare serialized passengers payload including seat mappings dynamically
        const passengersList = seatIds.map((seatId, idx) => {
            const pInfo = passengers && passengers[idx] ? passengers[idx] : {};
            return {
                firstName: pInfo.firstName || `Passenger-${idx + 1}`,
                lastName: pInfo.lastName || `LastName-${idx + 1}`,
                email: pInfo.email || null,
                phoneNumber: pInfo.phoneNumber || null,
                passportNumber: pInfo.passportNumber || null,
                seatId
            };
        });

        // 4. Calculate total price
        const totalPrice = flight.price * seatIds.length;

        // 5. Create booking with status PENDING in local DB
        booking = await bookingRepository.create(
            {
                flightId,
                userId,
                status: 'PENDING',
                noOfSeats: seatIds.length,
                totalPrice,
                passengers: JSON.stringify(passengersList)
            },
            { transaction }
        );

        await transaction.commit();
    } catch(error) {
        await transaction.rollback();
        console.log(error);
        if (error instanceof AppError) throw error;
        throw new AppError('Cannot initiate booking creation', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    // 6. Downstream API Call to Flight Service to hold seats
    try {
        const reservedUntil = new Date(Date.now() + ServerConfig.BOOKING_TIMEOUT * 1000);
        await FlightServiceClient.reserveSeats(data.flightId, data.seatIds, booking.id, reservedUntil);
        
        // 7. Store TTL key in Redis (idempotent, EX set resets or sets the expiry time)
        const redisKey = `booking:expiry:${booking.id}`;
        const redisValue = JSON.stringify({
            bookingId: booking.id,
            flightId: data.flightId,
            seatIds: data.seatIds
        });
        await RedisConfig.redisClient.set(redisKey, redisValue, {
            EX: ServerConfig.BOOKING_TIMEOUT
        });

        // Return booking details
        const freshBooking = await bookingRepository.get(booking.id);
        return freshBooking;
    } catch(error) {
        console.log("Downstream reserve seats failed, initiating compensating transaction...");
        // Saga Compensating transaction: Cancel local booking
        await bookingRepository.update(booking.id, { status: 'CANCELLED' });
        if (error instanceof AppError) throw error;
        throw new AppError('Failed to lock seats on Flight Service', StatusCodes.SERVICE_UNAVAILABLE);
    }
}

async function makePayment(paymentData) {
    const { bookingId, status } = paymentData;

    // 1. Fetch booking
    const booking = await bookingRepository.get(bookingId);
    
    // 2. Validate booking state is PENDING
    if (booking.status !== 'PENDING') {
        throw new AppError('This booking is not in a pending payment state', StatusCodes.BAD_REQUEST);
    }

    if (status === 'SUCCESS') {
        // Extract passenger list & seat IDs
        const passengersList = JSON.parse(booking.passengers || '[]');
        const seatIds = passengersList.map(p => p.seatId);

        // 3. Downstream call to Flight Service to confirm seats
        await FlightServiceClient.confirmSeats(booking.flightId, seatIds, bookingId);

        // 4. Create Passenger and Ticket records inside database transaction
        const dbTransaction = await db.sequelize.transaction();
        try {
            // Fetch flight seat map to map seat numbers
            const flightSeats = await FlightServiceClient.getFlightSeats(booking.flightId);
            const seatMap = new Map();
            flightSeats.forEach(fs => {
                seatMap.set(fs.seatId, fs.seatDetail?.seatNumber || `S${fs.seatId}`);
            });

            for (const pInfo of passengersList) {
                const firstName = pInfo.firstName;
                const lastName = pInfo.lastName;
                const email = pInfo.email || null;
                const phoneNumber = pInfo.phoneNumber || null;
                const passportNumber = pInfo.passportNumber || null;
                const seatId = pInfo.seatId;

                // Find or create passenger
                const [passenger] = await db.Passenger.findOrCreate({
                    where: { firstName, lastName, passportNumber },
                    defaults: { email, phoneNumber },
                    transaction: dbTransaction
                });

                // Generate unique PNR
                const pnr = `${generatePNR()}-${bookingId}`;

                // Get seat number
                const seatNumber = seatMap.get(seatId) || `S${seatId}`;

                // Create Ticket record
                await db.Ticket.create(
                    {
                        bookingId,
                        passengerId: passenger.id,
                        seatId,
                        seatNumber,
                        pnr
                    },
                    { transaction: dbTransaction }
                );
            }

            // Update booking status to CONFIRMED
            await bookingRepository.update(bookingId, { status: 'CONFIRMED' }, { transaction: dbTransaction });
            await dbTransaction.commit();
        } catch (err) {
            await dbTransaction.rollback();
            throw err;
        }

        // Delete Redis TTL key on success
        await RedisConfig.redisClient.del(`booking:expiry:${bookingId}`);

        // Fetch fully populated booking details
        const confirmedBooking = await db.Booking.findByPk(bookingId, {
            include: [
                {
                    model: db.Ticket,
                    include: [db.Passenger]
                }
            ]
        });
        return confirmedBooking;
    } else {
        // Extract passenger list & seat IDs
        const passengersList = JSON.parse(booking.passengers || '[]');
        const seatIds = passengersList.map(p => p.seatId);

        // 3. Downstream compensating call to Flight Service to release seats
        await FlightServiceClient.releaseSeats(booking.flightId, seatIds, bookingId);

        // 4. Update local booking status to CANCELLED inside transaction
        const dbTransaction = await db.sequelize.transaction();
        try {
            await bookingRepository.update(bookingId, { status: 'CANCELLED' }, { transaction: dbTransaction });
            await dbTransaction.commit();
        } catch (err) {
            await dbTransaction.rollback();
            throw err;
        }

        // Delete Redis TTL key on payment failure
        await RedisConfig.redisClient.del(`booking:expiry:${bookingId}`);

        // Fetch updated cancelled booking details
        const cancelledBooking = await bookingRepository.get(bookingId);
        return cancelledBooking;
    }
}

async function cancelBooking(bookingId, cancelReason = 'PAYMENT_TIMEOUT') {
    // 1. Fetch booking without transaction lock first (resilient check)
    const booking = await bookingRepository.get(bookingId);
    if (!booking) return null;

    // 2. Verify status is PENDING (idempotency check)
    if (booking.status !== 'PENDING') {
        return booking;
    }

    // 3. Extract seatIds from serialized passengers list
    const passengersList = JSON.parse(booking.passengers || '[]');
    const seatIds = passengersList.map(p => p.seatId);

    // 4. Downstream compensating call to Flight Service to release seats
    try {
        await FlightServiceClient.releaseSeats(booking.flightId, seatIds, bookingId);
    } catch(err) {
        console.error(`Failed downstream release seats for booking ${bookingId} on expiration:`, err);
        throw err;
    }

    // 5. Update local booking status inside a locked transaction
    const dbTransaction = await db.sequelize.transaction();
    try {
        const lockedBooking = await db.Booking.findByPk(bookingId, {
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (lockedBooking && lockedBooking.status === 'PENDING') {
            await bookingRepository.update(
                bookingId, 
                { 
                    status: 'CANCELLED',
                    cancelReason
                }, 
                { transaction: dbTransaction }
            );
        }
        await dbTransaction.commit();
    } catch (err) {
        await dbTransaction.rollback();
        throw err;
    }

    // 6. Delete Redis TTL key on cancellation
    await RedisConfig.redisClient.del(`booking:expiry:${bookingId}`);

    // Return updated cancelled booking details
    const cancelledBooking = await bookingRepository.get(bookingId);
    return cancelledBooking;
}

module.exports = {
    createBooking,
    makePayment,
    cancelBooking
};
