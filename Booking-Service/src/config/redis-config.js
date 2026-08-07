const { createClient } = require('redis');
const serverConfig = require('./server-config');

class MockRedisClient {
    constructor() {
        this.store = new Map();
        this.timeouts = new Map();
        this.isOpen = false;
        this.callbacks = {};
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    _trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    async connect() {
        this.isOpen = true;
        setTimeout(() => this._trigger('connect'), 10);
        return true;
    }

    async disconnect() {
        this.isOpen = false;
        return true;
    }

    async ping() {
        return 'PONG';
    }

    async set(key, value, options = {}) {
        this.store.set(key, value);
        
        if (options.EX) {
            if (this.timeouts.has(key)) {
                clearTimeout(this.timeouts.get(key));
            }
            const timeoutId = setTimeout(() => {
                this.store.delete(key);
                this.timeouts.delete(key);
                this._trigger('expired', key);
            }, options.EX * 1000);
            this.timeouts.set(key, timeoutId);
        }
        return 'OK';
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async del(key) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
        const existed = this.store.delete(key);
        return existed ? 1 : 0;
    }
}

let redisClient;
let isMock = false;

if (serverConfig.USE_MOCK_REDIS === 'true') {
    console.log('Using in-memory Mock Redis Client (configured in .env)');
    redisClient = new MockRedisClient();
    isMock = true;
} else {
    redisClient = createClient({
        url: serverConfig.REDIS_URL
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('Redis client connected successfully');
    });
}

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis, switching to in-memory fallback:', err);
        redisClient = new MockRedisClient();
        isMock = true;
        await redisClient.connect();
    }
})();

module.exports = {
    redisClient,
    isMock
};
