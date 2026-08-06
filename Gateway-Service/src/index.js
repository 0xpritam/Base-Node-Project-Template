const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { ServerConfig, Logger } = require('./config');
const routes = require('./routes');

const { RequestLogger, RateLimiter } = require('./middlewares');

// Startup validation for invalid CORS combinations according to specification
if (ServerConfig.CORS_CREDENTIALS && ServerConfig.CORS_ORIGIN === '*') {
    throw new Error('CORS Configuration Error: CORS_CREDENTIALS cannot be true when CORS_ORIGIN is "*"');
}

const app = express();

app.set('trust proxy', ServerConfig.TRUST_PROXY);

app.use(RequestLogger);
app.use(RateLimiter);
app.use(helmet());
app.use(cors({
    origin: ServerConfig.CORS_ORIGIN,
    methods: ServerConfig.CORS_METHODS,
    credentials: ServerConfig.CORS_CREDENTIALS
}));

// Mount health and base routes
app.use('/', routes);

// Catch-all route handler for undefined endpoints (serves only GET /health)
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        data: {},
        error: { explanation: `Cannot ${req.method} ${req.originalUrl}` }
    });
});

const server = app.listen(ServerConfig.PORT, () => {
    console.log(`Successfully started the API Gateway server on PORT : ${ServerConfig.PORT}`);
    Logger.info(`Successfully started the API Gateway server on PORT : ${ServerConfig.PORT}`);
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
