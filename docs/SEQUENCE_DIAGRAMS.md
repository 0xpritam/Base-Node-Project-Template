# Sequence Diagrams - Flight Booking System

This document visualizes the sequence of interactions across services and components for core business workflows.

---

## 1. Flight Search Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant Router as Flight Routes
    participant Ctrl as Flight Controller
    participant Service as Flight Service
    participant Repo as Flight Repository
    participant DB as Flights Database

    Client ->> Router: GET /api/v1/flights?trips=BOM-DEL&tripDate=2026-07-28
    Router ->> Ctrl: getAllFlights(req, res)
    Ctrl ->> Service: getAllFlights(query)
    Service ->> Service: Parse parameters & construct Sequelize query filters
    Service ->> Repo: getAllFlights(filters, sort)
    Repo ->> DB: Flight.findAll({ where: filters, include: [Airplane, Airport, City] })
    DB -->> Repo: Return data list
    Repo -->> Service: Return flight data
    Service -->> Ctrl: Return data list
    Ctrl ->> Ctrl: Wrap inside SuccessResponse envelope
    Ctrl -->> Client: HTTP 200 OK (JSON Response)
```

---

## 2. Booking Creation & Seat Reservation

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant BS as Booking Service
    participant FS as Flight Service
    participant FDB as Flight Database

    Client ->> BS: POST /api/v1/bookings (flightId, userId, seatIds)
    activate BS
    BS ->> BS: Create record with status PENDING in Booking DB
    BS ->> FS: PATCH /api/v1/flights/:id/seats (seats: N, dec: true, seatIds)
    activate FS
    FS ->> FS: Start local transaction
    FS ->> FDB: SELECT * FROM FlightSeats WHERE id IN (seatIds) FOR UPDATE;
    Note over FS,FDB: Check if seats are available (bookingId IS NULL)
    alt Seats Available
        FS ->> FDB: UPDATE FlightSeats SET bookingId = [newId]
        FS ->> FDB: UPDATE Flights SET totalSeats = totalSeats - N
        FS ->> FS: Commit transaction
        FS -->> BS: HTTP 200 OK (Seats Locked)
        BS ->> BS: Start 10-minute expiry timer in Redis
        BS -->> Client: HTTP 201 Created (Booking details & Payment URL)
    else Seats Occupied
        FS ->> FS: Rollback transaction
        FS -->> BS: HTTP 400 Bad Request (Seats Occupied)
        BS ->> BS: Update booking record to CANCELLED in Booking DB
        BS -->> Client: HTTP 400 Bad Request (Reservation Failed)
        deactivate FS
    end
    deactivate BS
```

---

## 3. Payment Success Flow

```mermaid
sequenceDiagram
    autonumber
    actor Gateway as Payment Gateway Webhook
    participant BS as Booking Service
    participant Redis as Redis Cache
    participant BDB as Booking Database

    Gateway ->> BS: POST /api/v1/bookings/payments (bookingId, TXN, SUCCESS)
    activate BS
    BS ->> BDB: Fetch Booking by ID
    BDB -->> BS: Return PENDING booking
    BS ->> BS: Verify transaction signature
    BS ->> BDB: Update booking status to CONFIRMED
    BS ->> BDB: Insert Ticket details (generate PNRs & map seats)
    BS ->> Redis: Delete expiry lock key "booking:expiry:{bookingId}"
    BS -->> Gateway: HTTP 200 OK
    deactivate BS
```

---

## 4. Payment Failure Flow

```mermaid
sequenceDiagram
    autonumber
    actor Gateway as Payment Gateway Webhook
    participant BS as Booking Service
    participant FS as Flight Service
    participant BDB as Booking Database

    Gateway ->> BS: POST /api/v1/bookings/payments (bookingId, FAILED)
    activate BS
    BS ->> BDB: Fetch Booking by ID
    BDB -->> BS: Return PENDING booking
    BS ->> BDB: Update booking status to CANCELLED
    BS ->> FS: PATCH /api/v1/flights/:id/seats (seats: N, dec: false, seatIds)
    Note over FS: Release seat reservation (increments capacity, resets bookingId = NULL)
    FS -->> BS: HTTP 200 OK (Seats Released)
    BS -->> Gateway: HTTP 200 OK
    deactivate BS
```

---

## 5. Booking Expiration (Timeout)

```mermaid
sequenceDiagram
    autonumber
    participant Redis as Redis Cache
    participant Worker as Expiration Worker
    participant BS as Booking Service
    participant FS as Flight Service
    participant BDB as Booking Database

    Note over Redis: 10 minutes pass without payment...
    Redis ->> Worker: Key expired event ("booking:expiry:789")
    activate Worker
    Worker ->> BS: Trigger timeout check (bookingId: 789)
    BS ->> BDB: Fetch Booking 789
    BDB -->> BS: Return booking (status: PENDING)
    BS ->> BDB: Update booking status to CANCELLED
    BS ->> FS: PATCH /api/v1/flights/:id/seats (seats: N, dec: false, seatIds)
    Note over FS: Compensating transaction: release seats in Flight DB
    FS -->> BS: HTTP 200 OK
    deactivate Worker
```

---

## 6. Booking Cancellation & Refund Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Client
    participant BS as Booking Service
    participant FS as Flight Service
    participant Gateway as Payment Gateway API
    participant BDB as Booking Database

    User ->> BS: POST /api/v1/bookings/:id/cancel
    activate BS
    BS ->> BDB: Check if status is CONFIRMED
    BDB -->> BS: Valid confirmed booking
    BS ->> BDB: Update status to CANCELLATION_PENDING
    BS ->> FS: PATCH /api/v1/flights/:id/seats (seats: N, dec: false, seatIds)
    Note over FS: Release seats in Flight DB
    FS -->> BS: HTTP 200 OK (Seats released)
    BS ->> BDB: Update status to REFUND_PENDING
    BS ->> Gateway: Request transaction refund (amount, transactionId)
    activate Gateway
    Gateway -->> BS: Refund accepted / pending settlement
    deactivate Gateway
    BS ->> BDB: Update status to REFUNDED
    BS -->> User: HTTP 200 OK (Cancellation & Refund Processed)
    deactivate BS
```
