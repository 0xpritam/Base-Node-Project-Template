const express = require('express');
const { ServerConfig, Logger } = require('./config');
const apiRoutes = require('./routes');
const { startWorkers } = require('./workers/booking-worker');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            message: 'Something went wrong',
            data: {},
            error: {}
        }
    };
    responseStorage.run(store, next);
});

app.use('/api', apiRoutes);

app.listen(ServerConfig.PORT, () => {
    console.log(`Successfully started the Booking Service server on PORT : ${ServerConfig.PORT}`);
    Logger.info(`Successfully started the Booking Service server on PORT : ${ServerConfig.PORT}`);
    
    // Start background Expiration and Recovery workers
    startWorkers();
});
