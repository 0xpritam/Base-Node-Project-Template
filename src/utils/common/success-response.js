const responseStorage = require('./response-context');

const successProxy = new Proxy({}, {
    get(target, prop) {
        const store = responseStorage.getStore();
        if (store) {
            return store.successResponse[prop];
        }
        // Fallback static structure
        const fallback = {
            success: true,
            message: 'Successfully completed the request',
            data: {},
            error: {}
        };
        return fallback[prop];
    },
    set(target, prop, value) {
        const store = responseStorage.getStore();
        if (store) {
            store.successResponse[prop] = value;
            return true;
        }
        return false;
    },
    ownKeys(target) {
        const store = responseStorage.getStore();
        return store ? Reflect.ownKeys(store.successResponse) : ['success', 'message', 'data', 'error'];
    },
    getOwnPropertyDescriptor(target, prop) {
        return {
            enumerable: true,
            configurable: true
        };
    }
});

module.exports = successProxy;