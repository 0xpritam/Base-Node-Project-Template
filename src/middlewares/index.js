module.exports = {
    AirplainMiddlewares: require('./airplane-middlewares'),
    CityMiddlewares : require('./city-middlewares'),
    AirportMiddlewares : require('./airport-middlewares'),
    FlightMiddlewares : require('./flight-middlewares'),
    IdempotencyMiddlewares: require('./idempotency-middleware'),
    AuthenticateJWT: require('./authenticate-jwt'),
    AuthorizeRoles: require('./authorize-roles')
}