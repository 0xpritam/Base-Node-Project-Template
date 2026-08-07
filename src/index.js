const express = require('express');

const { ServerConfig,Logger }  = require("./config/index.");
const apiRoutes = require('./routes')

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

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

app.listen(ServerConfig.PORT, async ()=>{
    console.log(`server is running on ${ServerConfig.PORT}`);
    // Logger.info("successfully started the server", "root", {})

});