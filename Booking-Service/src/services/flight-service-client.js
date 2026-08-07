const { ServerConfig } = require('../config');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

class FlightServiceClient {
    async getFlightDetails(flightId) {
        try {
            const response = await fetch(`${ServerConfig.FLIGHT_SERVICE_PATH}/api/v1/flight/${flightId}`);
            const result = await response.json();
            
            if (!response.ok) {
                const message = result?.ErrorRespose?.error?.explanation || 'Failed to fetch flight details';
                throw new AppError(message, response.status);
            }
            return result.SuccessResponse.data;
        } catch(error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Flight Service is currently unreachable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }
    async getFlightSeats(flightId) {
        try {
            const response = await fetch(`${ServerConfig.FLIGHT_SERVICE_PATH}/api/v1/flight/${flightId}/seats`);
            const result = await response.json();
            
            if (!response.ok) {
                const message = result?.ErrorRespose?.error?.explanation || 'Failed to fetch flight seats';
                throw new AppError(message, response.status);
            }
            return result.SuccessResponse.data;
        } catch(error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Flight Service is currently unreachable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }
    async reserveSeats(flightId, seatIds, bookingId, reservedUntil = null) {
        try {
            const response = await fetch(`${ServerConfig.FLIGHT_SERVICE_PATH}/api/v1/flight/${flightId}/seats`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `${bookingId}-RESERVE`
                },
                body: JSON.stringify({
                    action: 'RESERVE',
                    seatIds,
                    bookingId,
                    reservedUntil
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const message = result?.ErrorRespose?.error?.explanation || 'Failed to reserve seats';
                throw new AppError(message, response.status);
            }
            return result.SuccessResponse.data;
        } catch(error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Flight Service seat reservation failed or unreachable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }

    async releaseSeats(flightId, seatIds, bookingId) {
        try {
            const response = await fetch(`${ServerConfig.FLIGHT_SERVICE_PATH}/api/v1/flight/${flightId}/seats`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `${bookingId}-RELEASE`
                },
                body: JSON.stringify({
                    action: 'RELEASE',
                    seatIds,
                    bookingId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const message = result?.ErrorRespose?.error?.explanation || 'Failed to release seats';
                throw new AppError(message, response.status);
            }
            return result.SuccessResponse.data;
        } catch(error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Flight Service seat release failed or unreachable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }

    async confirmSeats(flightId, seatIds, bookingId) {
        try {
            const response = await fetch(`${ServerConfig.FLIGHT_SERVICE_PATH}/api/v1/flight/${flightId}/seats`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `${bookingId}-CONFIRM`
                },
                body: JSON.stringify({
                    action: 'CONFIRM',
                    seatIds,
                    bookingId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const message = result?.ErrorRespose?.error?.explanation || 'Failed to confirm seats';
                throw new AppError(message, response.status);
            }
            return result.SuccessResponse.data;
        } catch(error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Flight Service seat confirmation failed or unreachable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }
}

module.exports = new FlightServiceClient();
