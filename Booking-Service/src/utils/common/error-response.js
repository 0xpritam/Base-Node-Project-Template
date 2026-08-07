const responseStorage = require('./response-context');

const errorProxy = new Proxy({}, {
    get(target, prop) {
        const store = responseStorage.getStore();
        if (store) {
            return store.errorResponse[prop];
        }
        const fallback = {
            success: false,
            message: 'Something went wrong',
            data: {},
            error: {}
        };
        return fallback[prop];
    },
    set(target, prop, value) {
        const store = responseStorage.getStore();
        if (store) {
            store.errorResponse[prop] = value;
            return true;
        }
        return false;
    },
    ownKeys(target) {
        const store = responseStorage.getStore();
        return store ? Reflect.ownKeys(store.errorResponse) : ['success', 'message', 'data', 'error'];
    },
    getOwnPropertyDescriptor(target, prop) {
        return {
            enumerable: true,
            configurable: true
        };
    }
});

module.exports = errorProxy;
