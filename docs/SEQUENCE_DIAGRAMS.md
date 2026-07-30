# Sequence Diagrams - Flight Booking System

This document visualizes the sequence of interactions across services and components for core business workflows.

---

## 1. Successful Booking (Hold & Payment Success)

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant BS as Booking Service
    participant Redis as Redis Cache
    participant FS as Flight Service
    participant DB as Flights Database
    participant GW as Payment Gateway (Mock)

    Client ->> BS: POST /api/v1/bookings (flightId, userId, seatIds)
    activate BS
    BS ->> BS: Create booking record in DB (status: PENDING)
    
    BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "RESERVE", seatIds, bookingId: 789, reservedUntil: NOW+10m }
    activate FS
    FS ->> FS: Start Database Transaction
    FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
    Note over FS,DB: Pessimistic Row Lock Acquired
    FS ->> FS: Verify all seats are in AVAILABLE status
    
    alt Seats are AVAILABLE
        FS ->> DB: UPDATE FlightSeats SET status = 'HELD', bookingId = 789, reservedUntil = NOW+10m
        FS ->> DB: UPDATE Flights SET totalSeats = totalSeats - N (Decrement capacity)
        FS ->> FS: Commit Database Transaction
        FS -->> BS: HTTP 200 OK (Seats Held Successfully)
        
        BS ->> Redis: SET booking:expiry:789 "PENDING" EX 600 (10-minute hold TTL)
        BS ->> GW: Generate Checkout Invoice / Payment link
        GW -->> BS: Payment Link URL
        BS -->> Client: HTTP 201 Created (Booking details & Payment Link)
    else Seats occupied or held by another transaction
        FS ->> FS: Rollback Database Transaction
        FS -->> BS: HTTP 400 Bad Request (Conflict / Seat Unavailable)
        BS ->> BS: Update booking record in DB (status: CANCELLED)
        BS -->> Client: HTTP 400 Bad Request (Seats no longer available)
        deactivate FS
    end
    deactivate BS

    Note over Client, GW: User opens Payment Link and pays successfully
    GW ->> BS: POST /api/v1/bookings/payments Webhook { bookingId: 789, status: "SUCCESS", transactionId: "TXN123" }
    activate BS
    BS ->> BS: Verify status is PENDING
    BS ->> BS: Update booking status to CONFIRMED
    BS ->> Redis: DEL booking:expiry:789 (Clear expiration hold)
    
    BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "CONFIRM", seatIds, bookingId: 789 }
    activate FS
    FS ->> FS: Start Database Transaction
    FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
    Note over FS,DB: Pessimistic Row Lock Acquired
    FS ->> FS: Verify seats belong to booking 789 and are in HELD status
    FS ->> DB: UPDATE FlightSeats SET status = 'BOOKED', reservedUntil = NULL
    FS ->> FS: Commit Database Transaction
    FS -->> BS: HTTP 200 OK (Seats Confirmed)
    deactivate FS

    BS ->> BS: Generate Ticket Passenger Records & PNRs
    BS -->> GW: HTTP 200 OK
    deactivate BS
```

---

## 2. Payment Failure Flow

```mermaid
sequenceDiagram
    autonumber
    actor GW as Payment Gateway (Mock)
    participant BS as Booking Service
    participant Redis as Redis Cache
    participant FS as Flight Service
    participant DB as Flights Database

    GW ->> BS: POST /api/v1/bookings/payments Webhook { bookingId: 789, status: "FAILED" }
    activate BS
    BS ->> BS: Update booking status to CANCELLED in DB
    BS ->> Redis: DEL booking:expiry:789 (Clear hold timer)

    BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "RELEASE", seatIds, bookingId: 789 }
    activate FS
    FS ->> FS: Start Database Transaction
    FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
    Note over FS,DB: Pessimistic Row Lock Acquired
    FS ->> FS: Verify seats belong to booking 789 and are HELD or BOOKED
    FS ->> DB: UPDATE FlightSeats SET status = 'AVAILABLE', bookingId = NULL, reservedUntil = NULL
    FS ->> DB: UPDATE Flights SET totalSeats = totalSeats + N (Restore capacity)
    FS ->> FS: Commit Database Transaction
    FS -->> BS: HTTP 200 OK (Seats Released Successfully)
    deactivate FS

    BS -->> GW: HTTP 200 OK
    deactivate BS
```

---

## 3. Booking Expiration (Timeout) Flow

```mermaid
sequenceDiagram
    autonumber
    participant Redis as Redis Cache
    participant Worker as Timeout Expiration Worker
    participant BS as Booking Service
    participant FS as Flight Service
    participant DB as Flights Database

    Note over Redis: 10 minutes pass... key expires
    Redis -->> Worker: Keyspace Expiration Notification: expired "booking:expiry:789"
    activate Worker
    
    Worker ->> BS: Trigger timeout check (bookingId: 789)
    activate BS
    BS ->> BS: Fetch Booking 789 status from DB
    
    alt Booking status is still PENDING
        BS ->> BS: Update booking status to CANCELLED in DB
        
        BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "RELEASE", seatIds, bookingId: 789 }
        activate FS
        FS ->> FS: Start Database Transaction
        FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
        Note over FS,DB: Pessimistic Row Lock Acquired
        FS ->> FS: Verify seats belong to booking 789 and status is HELD
        FS ->> DB: UPDATE FlightSeats SET status = 'AVAILABLE', bookingId = NULL, reservedUntil = NULL
        FS ->> DB: UPDATE Flights SET totalSeats = totalSeats + N
        FS ->> FS: Commit Database Transaction
        FS -->> BS: HTTP 200 OK (Seats Released)
        deactivate FS
        
        BS -->> Worker: Timeout Processed (Seats Freed)
    else Booking status is already CONFIRMED
        BS -->> Worker: Timeout Ignored (Payment already completed)
    end
    deactivate BS
    deactivate Worker
```

---

## 4. User Cancellation Before Payment

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant BS as Booking Service
    participant Redis as Redis Cache
    participant FS as Flight Service
    participant DB as Flights Database

    Client ->> BS: POST /api/v1/bookings/789/cancel
    activate BS
    BS ->> BS: Fetch booking 789. Check if status is PENDING
    
    alt Status is PENDING
        BS ->> BS: Update booking status to CANCELLED
        BS ->> Redis: DEL booking:expiry:789 (Remove hold timer)
        
        BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "RELEASE", seatIds, bookingId: 789 }
        activate FS
        FS ->> FS: Start Database Transaction
        FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
        Note over FS,DB: Pessimistic Row Lock Acquired
        FS ->> FS: Verify seats belong to booking 789 and status is HELD
        FS ->> DB: UPDATE FlightSeats SET status = 'AVAILABLE', bookingId = NULL, reservedUntil = NULL
        FS ->> DB: UPDATE Flights SET totalSeats = totalSeats + N
        FS ->> FS: Commit Database Transaction
        FS -->> BS: HTTP 200 OK (Seats Released)
        deactivate FS
        
        BS -->> Client: HTTP 200 OK (Booking Cancelled successfully)
    else Booking is already CONFIRMED or CANCELLED
        BS -->> Client: HTTP 400 Bad Request (Cannot cancel booking in current state)
    end
    deactivate BS
```

---

## 5. Seat Confirmation (Flight Service Internals)

```mermaid
sequenceDiagram
    autonumber
    participant BS as Booking Service
    participant FS as Flight Service
    participant DB as Flights Database

    BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "CONFIRM", seatIds, bookingId }
    activate FS
    FS ->> FS: Start Database Transaction
    
    FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
    Note over FS,DB: Pessimistic Row Lock holds updates from other transactions
    
    FS ->> FS: Validate seat bounds and ensure seatIds count matches database rows
    FS ->> FS: Verify each row.bookingId matches supplied bookingId
    FS ->> FS: Verify each row.status is HELD
    
    alt Validation Passes
        FS ->> DB: UPDATE FlightSeats SET status = 'BOOKED', reservedUntil = NULL WHERE flightId = :id AND seatId IN (:seatIds);
        FS ->> FS: Commit Database Transaction
        FS -->> BS: HTTP 200 OK { success: true, confirmedSeatsCount: N }
    else Validation Fails (Wrong bookingId or not HELD)
        FS ->> FS: Rollback Database Transaction
        FS -->> BS: HTTP 400 Bad Request (AppError: Invalid seat state/ownership)
    end
    deactivate FS
```

---

## 6. Seat Release (Flight Service Internals)

```mermaid
sequenceDiagram
    autonumber
    participant BS as Booking Service
    participant FS as Flight Service
    participant DB as Flights Database

    BS ->> FS: PATCH /api/v1/flight/:id/seats { action: "RELEASE", seatIds, bookingId }
    activate FS
    FS ->> FS: Start Database Transaction
    
    FS ->> DB: SELECT * FROM FlightSeats WHERE flightId = :id AND seatId IN (:seatIds) FOR UPDATE;
    Note over FS,DB: Pessimistic Row Lock holds updates from other transactions
    
    FS ->> FS: Validate seat bounds and ensure seatIds count matches database rows
    FS ->> FS: Verify each row.bookingId matches supplied bookingId
    FS ->> FS: Verify each row.status is HELD or BOOKED
    
    alt Validation Passes
        FS ->> DB: UPDATE FlightSeats SET status = 'AVAILABLE', bookingId = NULL, reservedUntil = NULL WHERE flightId = :id AND seatId IN (:seatIds);
        FS ->> DB: UPDATE Flights SET totalSeats = totalSeats + N WHERE id = :id;
        FS ->> FS: Commit Database Transaction
        FS -->> BS: HTTP 200 OK { success: true }
    else Validation Fails (Wrong bookingId or already AVAILABLE)
        FS ->> FS: Rollback Database Transaction
        FS -->> BS: HTTP 400 Bad Request (AppError: Invalid seat state/ownership)
    end
    deactivate FS
```
