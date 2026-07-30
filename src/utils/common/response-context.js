const { AsyncLocalStorage } = require('async_hooks');
const responseStorage = new AsyncLocalStorage();
module.exports = responseStorage;
