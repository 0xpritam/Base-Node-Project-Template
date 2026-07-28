# Development Roadmap - Flight Booking System

This roadmap details the current implementation status and outlines subsequent milestones for building, refining, and preparing the Flight Booking System for production.

---

## 1. Current Progress Registry

### Completed
* **Boilerplate Framework**: Initialized Express system with layered architectural directories (Controllers, Services, Repositories, Middlewares, Models, Config).
* **Airplane Service**: Full API CRUD operations, Sequelize model definitions, and database migrations.
* **City Service**: Standard API CRUD operations, Sequelize model definitions, validations, and database migrations.
* **Airport Service**: Standard API CRUD operations, Sequelize model definitions, unique code mappings, validations, and database migrations.
* **Flight Search Engine**: API endpoints to retrieve and filter scheduled flights based on parameters (pricing ranges, destination city pairs, dates) with associated airline detail inclusions.
* **Seat Table Schema**: Database schema models, seeders, and migrations for `Seats` containing rows, columns, and tier categorizations (`business`, `economy`, `first-class`).
* **Flight Service Stabilization & Debugging**: Fixed the Flight-Airport datatype mismatch, controller typos (`res.jsoon`), spelling inconsistencies (`updtateFlight`, `updtaeAirplane`), and middleware validation bugs.
* **Concurrency Seat Locking Engine**: Ported row-level transaction locking (`SELECT FOR UPDATE`) and the `PATCH /flight/:id/seats` API to the active root project.

### In Progress
* **Flight Seat Grid Engine (`FlightSeats`)**: Preparing schema definitions and model configurations.

### Remaining
* **Booking Service Microservice**: Complete service setup (orders, status machines, payment handlers, tables).
* **Timeout Manager**: Redis TTL keyspace listener or worker delay queue integrations.
* **Compensating Transactions**: Saga orchestration layer for payment errors or expired ticket states.
* **Auth Service Microservice**: Authenticated routes, roles management (customer vs. airline desk clerk), JWT generation.

---

## 2. Future Milestones Plan

```mermaid
gantt
    title System Development Schedule
    dateFormat  YYYY-MM-DD
    section Milestone 1: Reconcile & Debug
    Resolve Schema Bugs & Typo Rectification :done, 2026-07-29, 2d
    Port Concurrency Seat Locking Engine     :done, 2026-07-31, 2d
    section Milestone 2: Seat Grid Engine
    Create FlightSeat Table Schema & Model  :active, 2026-08-02, 2d
    Implement Eager Seat Map Seeding        : 2026-08-04, 3d
    Implement Specific Seat Booking API     : 2026-08-07, 2d
    section Milestone 3: Booking Service
    Scaffold Booking Service Core DB        : 2026-08-09, 3d
    Create Saga Orchestrator & Payment Flow : 2026-08-12, 5d
    Implement Redis Timeout Expiration Task : 2026-08-17, 3d
    section Milestone 4: Auth & Production
    Scaffold Auth Service & JWT Middleware  : 2026-08-20, 4d
    System Integration & Load Testing       : 2026-08-24, 4d
```

### Milestone 1: Reconcile & Debug (Completed)
* **Goal**: Rectify all existing model/migration discrepancies, syntax typos, and port the transaction locking engine.
* **Tasks Completed**:
  1. Fixed `departureAirportId` and `arrivalAirportId` datatypes in `src/models/flight.js` from `INTEGER` to `STRING`.
  2. Fixed controller typos (`res.jsoon` $\rightarrow$ `res.json`, functions `updtateFlight`, `updtaeAirplane`, middleware `ErrorResponce`).
  3. Implemented `updateRemainingSeats` with pessimistic row locking (`SELECT FOR UPDATE`) and exposed `PATCH /api/v1/flight/:id/seats`.

### Milestone 2: Flight Seat Grid Engine (Est. Duration: 7 Days)
* **Goal**: Build dynamic seat mapping and specific seat reservation interfaces.
* **Tasks**:
  1. Create the `FlightSeat` model and migration (junction table linking `flightId`, `seatId`, `bookingId`).
  2. Write eager allocation logic inside the Flight Service: when a flight is successfully scheduled, automatically populate the seat grid rows in `FlightSeats` for that flight.
  3. Add `GET /api/v1/flights/:id/seats` API to fetch flight seat configurations, indicating occupied vs. open seats.

### Milestone 3: Booking Service Scaffold (Est. Duration: 11 Days)
* **Goal**: Implement the Booking Service as a standalone service.
* **Tasks**:
  1. Initialize the new Booking Service directory and database schemas (`Bookings`, `Passengers`, `Tickets` tables).
  2. Write the Saga Orchestrator: handle `POST /bookings` (reserve seat counts, save order state as `PENDING`, invoke Payment gateway checkout).
  3. Implement **Redis Expiration Worker**: publish key exhalations to automatically release locked seats on the Flight Service if payment is not confirmed within 10 minutes.
  4. Write payment webhook callback handler.

### Milestone 4: Auth Service & Production Prep (Est. Duration: 8 Days)
* **Goal**: Wrap endpoints in authentication boundaries and run verification checks.
* **Tasks**:
  1. Scaffold Auth Service (`User`, `Role`, `UserRoles` schemas).
  2. Write authentication and authorization middlewares (checking JWT tokens and role privileges, e.g. preventing standard users from deleting airports).
  3. Conduct end-to-end integration tests, load test the concurrency safe locking mechanism, and containerize the stack (Docker / Docker Compose).
