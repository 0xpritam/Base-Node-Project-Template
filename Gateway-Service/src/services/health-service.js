const { ServerConfig } = require('../config');

async function checkServiceHealth(name, baseUrl, path = '/api/v1/info') {
    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const startTime = Date.now();
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        
        const responseTimeMs = Date.now() - startTime;
        
        // If the service responds with a valid response code, it is UP
        const status = (res.status >= 200 && res.status < 400) ? 'UP' : 'DOWN';
        return {
            name,
            status,
            responseTimeMs
        };
    } catch (e) {
        clearTimeout(id);
        return {
            name,
            status: 'DOWN',
            responseTimeMs: null
        };
    }
}

async function getAggregatedHealth() {
    const servicesToCheck = [
        { name: 'auth', url: ServerConfig.AUTH_SERVICE_URL },
        { name: 'booking', url: ServerConfig.BOOKING_SERVICE_URL },
        { name: 'flight', url: ServerConfig.FLIGHT_SERVICE_URL }
    ];

    const results = await Promise.allSettled(
        servicesToCheck.map(svc => checkServiceHealth(svc.name, svc.url))
    );

    const services = {};
    for (const res of results) {
        if (res.status === 'fulfilled') {
            const { name, status, responseTimeMs } = res.value;
            services[name] = {
                status,
                responseTimeMs
            };
        }
    }

    // Default missing services to DOWN if any promise fails structurally
    for (const svc of servicesToCheck) {
        if (!services[svc.name]) {
            services[svc.name] = {
                status: 'DOWN',
                responseTimeMs: null
            };
        }
    }

    return services;
}

module.exports = {
    getAggregatedHealth
};
