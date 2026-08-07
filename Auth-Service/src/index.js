const express = require('express');
const { ServerConfig, Logger } = require('./config');
const apiRoutes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response context middleware (for AsyncLocalStorage response context isolation)
const responseStorage = require('./utils/common/response-context');
app.use((req, res, next) => {
    const store = {
        successResponse: {
            success: true,
            message: 'Successfully completed the request',
            data: {},
            error: {}
        },
        errorResponse: {
            success: false,
            message: 'something went wrong',
            data: {},
            error: {}
        }
    };
    responseStorage.run(store, next);
});

app.use('/api', apiRoutes);

// Catch-all route handler for undefined endpoints
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        data: {},
        error: { explanation: `Cannot ${req.method} ${req.originalUrl}` }
    });
});

const server = app.listen(ServerConfig.PORT, () => {
    console.log(`Successfully started the Auth Service server on PORT : ${ServerConfig.PORT}`);
    Logger.info(`Successfully started the Auth Service server on PORT : ${ServerConfig.PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    Logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        Logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    Logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        Logger.info('HTTP server closed');
        process.exit(0);
    });
});
