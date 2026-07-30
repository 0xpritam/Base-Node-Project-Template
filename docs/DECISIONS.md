# Architectural Decisions Records (ADR) - Flight Booking System

This document outlines key technical decisions made during the design of the Flight Booking System, describing why each option was selected along with tradeoffs and alternatives.

---

## Decision 1: The Repository Pattern & Generic CRUD Repository

### Context:
Interacting with the database (Sequelize models) directly from controllers or services mixes data retrieval queries with business logic, making it difficult to switch databases or mock databases during testing.

### Decision:
Implement the **Repository Pattern** using a base `CrudRepository` class that handles generic operations (create, get, getAll, update, destroy), with model-specific repository subclasses (e.g. `FlightRepository`) extending it for custom query methods.

* **Advantages**:
  * Decouples business logic (services) from data access technologies (Sequelize ORM).
  * Promotes DRY code (common CRUD methods written once in the base class).
  * Simplifies unit testing by allowing repositories to be mocked easily.
* **Disadvantages**:
  * Adds an extra layer of abstraction, increasing directory structure complexity for simple database actions.
* **Alternatives**:
  * Direct ORM calls (`Model.create`, etc.) inside the Service layer.
* **Why this project should use it**:
  * Since our seat allocation rules require specific transaction locking mechanisms (`SELECT FOR UPDATE`), keeping these data-centric queries inside isolated repository files (like `flight-repository.js`) ensures they do not pollute the core domain business rules inside the services layer.

---

## Decision 2: The Service Layer

### Context:
Controller methods frequently end up bloated when they contain validation checks, payment orchestrations, database checks, and response formatting, violating the Single Responsibility Principle.

### Decision:
Utilize a dedicated **Service Layer** between controllers and repositories to hold all functional rules (e.g. comparing flight arrival/departure times, constructing search filters).

* **Advantages**:
  * Controllers remain extremely lightweight, focusing strictly on request extraction and response shaping.
  * Business operations can be reused across different routes or protocols (e.g., HTTP vs. gRPC or Cron tasks).
* **Disadvantages**:
  * For simple CRUD resources (like fetching an airplane), the Service layer just passes requests straight to the Repository without adding value, creating "pass-through" boilerplate code.
* **Alternatives**:
  * Placing business calculations inside controllers or repository files.
* **Why this project should use it**:
  * Complex workflows like seat booking involve communicating with payment gateways and remote services. The Service layer is the ideal place to orchestrate these actions, keeping controllers clean.

---

## Decision 3: Eager Seat Mapping (The `FlightSeat` model)

### Context:
When an airplane is scheduled for a flight, how do we track seat availability? We must model seat configurations so they don't leak between different flights.

### Decision:
Adopt an **Eager Allocation** strategy: When a flight is created, fetch all seats for that airplane and bulk-populate the `FlightSeats` table mapping the `flightId` to all physical `seatId`s, initializing `bookingId = NULL`.

* **Advantages**:
  * Simplifies seat maps queries: rendering available seats for a flight is a simple query (`WHERE flightId = X`).
  * Enables pessimistic database locks: we can directly lock specific seat rows using SQL `FOR UPDATE` queries because the rows are guaranteed to exist.
* **Disadvantages**:
  * Increased write volume during flight creation (e.g. bulk-inserting 180 rows per flight).
  * Higher storage footprint in the database.
* **Alternatives**:
  * **Lazy Allocation (Sparse)**: Only write rows to the database when a seat is actually booked. If a row doesn't exist, the seat is available.
* **Why this project should use it**:
  * Eager allocation's query speed and row-level locking capabilities are critical for ticket-booking applications where double-booking must be prevented at all costs.

---

## Decision 4: Concurrency Safety via `SELECT FOR UPDATE`

### Context:
Under high traffic, multiple users might attempt to check out the same seat or book tickets when only one seat remains (inventory race conditions).

### Decision:
Employ database transaction-level **Pessimistic Locking** (`SELECT FOR UPDATE`) on the Flight Service when reserving seats.

* **Advantages**:
  * Strong consistency: guarantees that only one transaction can acquire a write lock on a specific seat, preventing double-bookings.
  * Simple application implementation: the database manages queues and lock waits, preventing application thread races.
* **Disadvantages**:
  * Database lock contention: other users attempting to book seats on the same flight are forced to wait, potentially increasing response times under heavy concurrent loads.
* **Alternatives**:
  * **Optimistic Locking**: Add a `version` column to the table. Transactions check if version has changed before writing. (Fails frequently under high conflict, forcing retries).
* **Why this project should use it**:
  * Flight seat selection is highly concurrent, but restricted to small sets of rows (the specific seats selected). Pessimistic row locking blocks only those specific seats, leaving other seats on the same flight free to be booked simultaneously.

---

## Decision 5: Expiration Management via Redis TTL

### Context:
Pending bookings block seats from the general inventory. If a user drops off at the payment page, we must release those seats to prevent revenue loss.

### Decision:
Use **Redis Keyspace Notifications (TTL Expiry)**. Write a temporary key for the pending booking ID with a 10-minute time-to-live. When the key expires, Redis publishes an event that triggers a compensating transaction to release the seats.

* **Advantages**:
  * High efficiency: offloads timers and timeouts from the database to Redis's memory engine.
  * Real-time release: seats are freed up immediately after the 10-minute window closes.
* **Disadvantages**:
  * Redis pub/sub does not guarantee message delivery. If the server crashes during an expiration event, the seat might remain locked indefinitely.
* **Alternatives**:
  * Run a background database cron job every minute checking for stale pending bookings. (Puts high read load on SQL database).
* **Why this project should use it**:
  * Combining **Redis TTL Expiry** (primary fast path) with a fallback **2-minute database cleanup Cron** (resilience path) gives us the best of both worlds: real-time performance and absolute data consistency.

---

## Decision 6: Microservice Separation (Flight vs. Booking Service)

### Context:
Combining schedule catalog queries, seat management, user authentication, and payment transactions into a single codebase limits scalability and creates a single point of failure.

### Decision:
Isolate domains into two distinct microservices: **Flight Service** (managing master flights, schedules, and airplane layouts) and **Booking Service** (managing orders, passenger details, and payment gateway interactions).

* **Advantages**:
  * High scalability: flight searching (read-heavy) can be scaled independently of order booking (write-heavy).
  * High fault tolerance: if the Booking Service crashes, users can still search for flights.
* **Disadvantages**:
  * Network overhead: services must communicate over network protocols (HTTP/gRPC), which adds latency.
  * Data consistency challenges: requires distributed transaction patterns (Sagas) rather than database transactions.
* **Alternatives**:
  * Monolithic codebase with a single database.
* **Why this project should use it**:
  * Microservices align with modern engineering practices for airlines. Separating the read-heavy search engine from the transactional booking system ensures peak performance during high-traffic events (e.g., holiday sales).

---

## Decision 7: Explicit Seat Status State Machine (`FlightSeats.status`)

### Context:
In traditional sparse architectures, seat availability is deduced implicitly (e.g., checking if `bookingId` is `NULL`). Under complex transaction lifecycles (holds, check-ins, refunds, timeouts), relying solely on `bookingId` creates ambiguity in tracking intermediate seat states.

### Decision:
Introduce an explicit `status` column on `FlightSeats` using an ENUM with values: `AVAILABLE`, `HELD`, and `BOOKED`.

* **Advantages**:
  * **Improved Readability**: The state of a seat is self-documenting directly inside the database row.
  * **Hold Windows Supporting TTL**: Differentiates between a seat currently in checkout hold (`HELD` with a `reservedUntil` timestamp) vs. a seat fully paid and reserved (`BOOKED`), simplifying cleanup scheduler queries.
  * **Auditability & Logging**: Facilitates debugging and analytical metrics on search cart abandonments (counting seats stuck in `HELD` state).
* **Disadvantages**:
  * Adds extra state to maintain during cancellations and state transitions.
* **Alternatives**:
  * Deducing holds from the existence of a corresponding row in a separate `SeatHolds` table.
* **Why this project should use it**:
  * Standardizing states as `AVAILABLE`, `HELD`, and `BOOKED` directly inside the Flight Service makes it extremely straightforward for the Booking Service to request a block, and for the redis timeout listener to free the seat.

---

## Decision 8: Inter-Service Idempotency via IdempotencyKeys Table

### Context:
Under unreliable network conditions, remote API requests can timeout or fail. If the Booking Service retries a seat reservation request, we must prevent double-reservation, double-releases, and duplicate seat confirmations.

### Decision:
Implement an database-backed **Idempotency Engine** inside the Flight Service using an `IdempotencyKeys` table. The `bookingId` serves as the idempotency key and is passed via the `X-Idempotency-Key` request header.

* **Advantages**:
  * **Absolute Safety**: Prevents duplicate seat state changes regardless of client retries or network drops.
  * **Generic Implementation**: Handled transparently by an Express middleware in the Flight Service, avoiding custom code changes inside core service logic.
  * **Conflict Detection**: Returns `409 Conflict` if a duplicate request arrives while the first call is still executing.
* **Disadvantages**:
  * Adds database write overhead for saving request keys and matching cached responses.
* **Alternatives**:
  * Let the business logic handle duplicates (e.g. ignoring duplicate checks in the service layers), which is highly error-prone and complex to maintain.
* **Why this project should use it**:
  * Distributed transactions (Sagas) rely heavily on idempotent operations. Having a central middleware in the Flight Service that caches and returns previous responses for the same `bookingId` guarantees consistency and robustness.

## Decision 9: Double-Guarded Expiry Saga (Redis TTL + Recovery Worker)

### Context:
When a booking is created, seats are placed in `HELD` status. If the payment is not completed within the timeout period, these seats must be released. Redis keyspace expiration notifications are excellent for immediate triggers, but they are not guaranteed (e.g. if the Node worker is down when the event triggers, or during Redis failovers).

### Decision:
Implement a double-guarded timeout architecture combining:
1. **Redis Expiration Worker**: Subscribes to keyspace notifications on `booking:expiry:<id>` and triggers compensating releases immediately on event fire.
2. **Recovery Worker**: A background job that scans the database periodically for stale `PENDING` bookings older than the configured timeout threshold and processes cancellations.

* **Advantages**:
  * **High Reliability**: Guarantees zero orphaned seat holds even if the Redis event listener crashes or loses events.
  * **Pessimistic Safety**: Uses database row locking (`SELECT FOR UPDATE`) to prevent race conditions between the workers and late-arriving payment webhooks.
  * **No Duplicate TTL Metadata**: Expiry worker parses the ID from the expired key and queries the database for metadata (which stores passengers/seats in the `passengers` column), eliminating the need for Redis twin-key synchronization.
