const express = require('express');
const { ServerConfig, Logger } = require('./config');
const apiRoutes = require('./routes');
const { startWorkers } = require('./workers/booking-worker');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.listen(ServerConfig.PORT, () => {
    console.log(`Successfully started the Booking Service server on PORT : ${ServerConfig.PORT}`);
    Logger.info(`Successfully started the Booking Service server on PORT : ${ServerConfig.PORT}`);
    
    // Start background Expiration and Recovery workers
    startWorkers();
});
