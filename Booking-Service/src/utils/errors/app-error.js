class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.explanation = message;
        this.name = 'AppError';
    }
}

module.exports = AppError;
