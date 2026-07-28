# Technical Architecture Review - Flight Booking System

**Role**: Senior Backend Engineer  
**Objective**: Review the active root project architecture, highlight structural strengths, identify critical vulnerabilities/bugs, and supply concrete recommendations for production readiness.

---

## 1. Structural Strengths
* **Highly Organized Folder Structure**: The codebase separates layers clearly, using routes, controllers, services, repositories, and models. This prevents mixing business logic with controller responses or database queries.
* **Reusable CRUD Patterns**: Implementing a base `CrudRepository` class eliminates repetitive SQL database queries across repositories, speeding up model development.
* **Decoupled Entities**: City, Airport, Airplane, and Flight entities are logically normalized in the database layer.
* **Validation Middleware**: Having separate validation middlewares (e.g. `validateCreateRequest`) protects the services layer from dealing with malformed JSON payloads.

---

## 2. Weaknesses & Vulnerabilities (Code Quality Concerns)

### A. Critical Bugs in Active Root Project
1. **Flight-Airport Association Bug**:
   * *File*: [flight.js](file:///c:/Users/prita/OneDrive/Desktop/Flight-Booking-System/src/models/flight.js#L38-L43)
   * *Issue*: `departureAirportId` and `arrivalAirportId` are defined as `DataTypes.INTEGER` in the model. However, the migration file defines them as `Sequelize.STRING` to link with `Airport.code` (e.g., "BOM", "DEL"). 
   * *Impact*: Any attempt to create flights or perform standard joins using airport codes will crash due to datatype mismatches.
2. **HTTP Controller Syntax Error**:
   * *File*: [flight-controllers.js](file:///c:/Users/prita/OneDrive/Desktop/Flight-Booking-System/src/controllers/flight-controllers.js#L46)
   * *Issue*: Calls `res.jsoon({ SuccessResponse })` with a typo (`jsoon`).
   * *Impact*: Querying a single flight crashes the server instance immediately.
3. **Broken Middleware Import**:
   * *File*: [city-middlewares.js](file:///c:/Users/prita/OneDrive/Desktop/Flight-Booking-System/src/middlewares/city-middlewares.js#L2)
   * *Issue*: Imports `ErrorResponce` (spelled with a `c` at the end), but the target file is named `error-response.js` and exports a default variable `error`. Inside the file, it also assigns properties to the wrong object.
   * *Impact*: Any validation failure during city creation crashes the process.

---

## 3. Production Readiness & Scalability Issues

### A. Missing Concurrency Management in Root Flight Service
* **Review**: The root project has no row-locking mechanics. If multiple transactions try to book the remaining seats of a flight, a race condition occurs, leading to **overbooking**.
* **Recommendation**: Port the raw SQL transaction query (`SELECT FOR UPDATE`) from the reference `Flights-Service` codebase into the root project's `flight-repositories.js` when allocating seats.

### B. Scalability Bottlenecks
* **Review**: Eager allocation creates 150-300 database rows in `FlightSeats` every time a flight is scheduled. Under heavy scheduling (thousands of flights), this table will grow rapidly.
* **Recommendation**: Add database partitioning on `FlightSeats` by `flightId` or `createdAt` to keep queries fast as data scales. Implement archival routines to purge completed historical flights.

### C. Security Deficiencies
* **Review**:
  * Write routes (POST, DELETE, PATCH) are completely unprotected, allowing anyone to delete airports or cities.
  * Inputs are checked only for existence; there is no validation for data types or sanitization against SQL injections (Sequelize handles basic escapes, but raw queries must be guarded).
* **Recommendation**: Implement an API Gateway with JWT verification middleware and role-based access control (RBAC). Ensure raw SQL queries (like locking queries) use bind parameters:
  ```javascript
  // Bad (vulnerable to injection):
  `SELECT * from Flights WHERE Flights.id = ${flightId} FOR UPDATE;`
  // Good:
  `SELECT * from Flights WHERE Flights.id = :flightId FOR UPDATE;`
  ```

### D. Production Configuration
* **Review**: The root `.env` config contains only the server port. Database passwords and dialysis settings are hardcoded in `config/config.json`.
* **Recommendation**: Extract all database configurations (host, username, password, timezone) out of `config.json` and inject them dynamically via `.env` environment variables using Sequelize's `use_env_variable` parameter.

---

## 4. API & Database Recommendations

1. **Pluralization Consistency**:
   * In the root routes, endpoints use singular paths (e.g. `/city`, `/airport`, `/flight`) but airplanes uses plural (`/airplanes`). Standardize all routing to use plural conventions: `/api/v1/cities`, `/api/v1/airports`, `/api/v1/flights`.
2. **Typo Cleanups**:
   * Rectify spelling errors on DB columns: `departurTime` $\rightarrow$ `departureTime`, `bordingGate` $\rightarrow$ `boardingGate` in migration files before moving to production databases.
3. **Health Check Endpoint**:
   * Enhance the `/info` endpoint to verify DB pool connections and memory limits rather than returning a static live string.
