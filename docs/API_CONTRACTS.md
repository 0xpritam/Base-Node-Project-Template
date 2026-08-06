# API Contracts Reference - Flight Booking System

This document outlines the active API endpoints for the root Flight Service, planned Booking Service APIs, internal utility endpoints, and request/response structures.

---

## 1. Flight Service APIs (Active Implementation)

All routes are prefixed with `/api/v1`.

### A. Airplanes Endpoints (`/airplanes`)

#### 1. Create Airplane
* **HTTP Method**: `POST`
* **Path**: `/airplanes`
* **Request Body**:
  ```json
  {
    "modelNumber": "Boeing737",
    "capacity": 180
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": {
        "id": 5,
        "modelNumber": "Boeing737",
        "capacity": 180,
        "updatedAt": "2026-07-28T22:30:00.000Z",
        "createdAt": "2026-07-28T22:30:00.000Z"
      },
      "error": {}
    }
  }
  ```
* **Error Response (`400 Bad Request` - Missing validation)**:
  ```json
  {
    "ErrorRespose": {
      "success": false,
      "message": "Something went wrong while creating airplanes",
      "data": {},
      "error": {
        "name": "AppError",
        "StatusCode": 400,
        "explanation": [
          "Model Number not found in the incomming request in the correct form"
        ]
      }
    }
  }
  ```

#### 2. Get All Airplanes
* **HTTP Method**: `GET`
* **Path**: `/airplanes`
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": [
        { "id": 1, "modelNumber": "airbus340", "capacity": 900 },
        { "id": 2, "modelNumber": "boeing777", "capacity": 450 }
      ],
      "error": {}
    }
  }
  ```

#### 3. Get Airplane by ID
* **HTTP Method**: `GET`
* **Path**: `/airplanes/:id`
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": { "id": 1, "modelNumber": "airbus340", "capacity": 900 },
      "error": {}
    }
  }
  ```

#### 4. Delete Airplane
* **HTTP Method**: `DELETE`
* **Path**: `/airplanes/:id`
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": 1,
      "error": {}
    }
  }
  ```

---

### B. Cities Endpoints (`/city`)

#### 1. Create City
* **HTTP Method**: `POST`
* **Path**: `/city`
* **Request Body**:
  ```json
  {
    "name": "Bangalore"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": {
        "id": 1,
        "name": "Bangalore",
        "createdAt": "2026-07-28T22:35:00.000Z",
        "updatedAt": "2026-07-28T22:35:00.000Z"
      },
      "error": {}
    }
  }
  ```

#### 2. Update City
* **HTTP Method**: `PATCH`
* **Path**: `/city/:id`
* **Request Body**:
  ```json
  {
    "name": "Bengaluru"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": [1],
      "error": {}
    }
  }
  ```

#### 3. Delete City
* **HTTP Method**: `DELETE`
* **Path**: `/city/:id`
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": 1,
      "error": {}
    }
  }
  ```

---

### C. Airports Endpoints (`/airport`)

#### 1. Create Airport
* **HTTP Method**: `POST`
* **Path**: `/airport`
* **Request Body**:
  ```json
  {
    "name": "Kempegowda International Airport",
    "code": "BLR",
    "address": "Devanahalli, Bengaluru",
    "cityId": 1
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": {
        "id": 1,
        "name": "Kempegowda International Airport",
        "code": "BLR",
        "address": "Devanahalli, Bengaluru",
        "cityId": 1,
        "updatedAt": "2026-07-28T22:40:00.000Z",
        "createdAt": "2026-07-28T22:40:00.000Z"
      },
      "error": {}
    }
  }
  ```

---

### D. Flights Endpoints (`/flight`)

#### 1. Create Flight
* **HTTP Method**: `POST`
* **Path**: `/flight`
* **Request Body**:
  ```json
  {
    "flightNumber": "QP 110",
    "airplaneId": 1,
    "departureAirportId": "BOM",
    "arrivalAirportId": "DEL",
    "arrivalTime": "2026-07-28T14:00:00.000Z",
    "departurTime": "2026-07-28T12:00:00.000Z",
    "price": 4200,
    "bordingGate": "A12",
    "totalSeats": 180
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": {
        "id": 1,
        "flightNumber": "QP 110",
        "airplaneId": 1,
        "departureAirportId": "BOM",
        "arrivalAirportId": "DEL",
        "arrivalTime": "2026-07-28T14:00:00.000Z",
        "departurTime": "2026-07-28T12:00:00.000Z",
        "price": 4200,
        "bordingGate": "A12",
        "totalSeats": 180,
        "createdAt": "2026-07-28T22:42:00.000Z",
        "updatedAt": "2026-07-28T22:42:00.000Z"
      },
      "error": {}
    }
  }
  ```

#### 2. Get All Flights (Search / Filter)
* **HTTP Method**: `GET`
* **Path**: `/flight`
* **Query Parameters**:
  * `trips`: `departureAirportCode-arrivalAirportCode` (e.g., `BOM-DEL`)
  * `price`: `minPrice-maxPrice` (e.g., `3000-8000`)
  * `totalSeats`: minimum seat capacity (e.g., `2`)
  * `tripDate`: flight date (e.g., `2026-07-28`)
  * `sort`: sorting criteria (e.g., `price_ASC`, `departurTime_DESC`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "successdully completed the request",
      "data": [
        {
          "id": 1,
          "flightNumber": "QP 110",
          "price": 4200,
          "airplanedetail": { "modelNumber": "airbus340", "capacity": 900 },
          "departureAirport": { "name": "CSMIA", "code": "BOM", "City": { "name": "Mumbai" } },
          "arrivalAirport": { "name": "IGIA", "code": "DEL", "City": { "name": "Delhi" } }
        }
      ]
    }
  }
  ```

---

## 2. Flight Seat Grid APIs

These endpoints are exposed by Flight Service to manage individual seat mappings.

### A. Get Flight Seat Map
* **HTTP Method**: `GET`
* **Path**: `/flight/:id/seats`
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "Successfully completed the request",
      "data": [
        {
          "seatId": 1,
          "seatNumber": "1A",
          "seatType": "economy",
          "status": "AVAILABLE"
        },
        {
          "seatId": 2,
          "seatNumber": "1B",
          "seatType": "business",
          "status": "HELD"
        }
      ],
      "error": {}
    }
  }
  ```

### B. Reserve/Release Seats
* **HTTP Method**: `PATCH`
* **Path**: `/flight/:id/seats`
* **Request Body**:
  ```json
  {
    "seatIds": [1, 2],
    "action": "RESERVE",
    "bookingId": 12345,
    "reservedUntil": "2026-07-29T10:10:00.000Z"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "SuccessResponse": {
      "success": true,
      "message": "Successfully completed the request",
      "data": true,
      "error": {}
    }
  }
  ```

---

## 3. Planned Booking Service APIs (Exposed to Client)

### A. Create Booking
* **HTTP Method**: `POST`
* **Path**: `/api/v1/bookings`
* **Headers**:
  * `Authorization`: `Bearer <Access_Token>` (Required)
* **Request Body**:
  ```json
  {
    "flightId": 1,
    "userId": 4, // (Ignored and overwritten by the authenticated req.user.id)
    "noOfSeats": 2,
    "passengers": [
      { "firstName": "John", "lastName": "Doe", "seatId": 14 },
      { "firstName": "Jane", "lastName": "Doe", "seatId": 15 }
    ]
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Booking initiated successfully",
    "data": {
      "bookingId": 789,
      "status": "PENDING",
      "totalPrice": 8400,
      "paymentUrl": "https://payment-gateway.com/pay/bk_789"
    }
  }
  ```

### B. Payment Webhook Callback
* **HTTP Method**: `POST`
* **Path**: `/api/v1/bookings/payments`
* **Headers**:
  * `Authorization`: `Bearer <Access_Token>` (Required)
* **Request Body**:
  ```json
  {
    "bookingId": 789,
    "transactionId": "TXN_7128919",
    "status": "SUCCESS"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Booking payment confirmed",
    "data": {
      "bookingId": 789,
      "status": "CONFIRMED",
      "tickets": [
        { "passenger": "John Doe", "seat": "2B", "pnr": "JD8819" },
        { "passenger": "Jane Doe", "seat": "2C", "pnr": "JD8820" }
      ]
    }
  }
  ```

---

## 4. Inter-Service Idempotency Contract

To prevent double-reservation, double-releases, and duplicate seat confirmations under network failures or retries, all inter-service seat modifications must enforce idempotency.

### Request Headers
* `X-Idempotency-Key` (Required): A unique string identifying the request transaction. In this booking lifecycle, the `bookingId` serves as the idempotency key.

### Behavior & Status Codes
* **First Request**: The Flight Service registers the `X-Idempotency-Key` as `PENDING`, executes the transaction, records the response status and body in `IdempotencyKeys` table, and returns the response.
* **Concurrent Duplicate Requests**: If a duplicate request with the same `X-Idempotency-Key` is received while the first execution is still active, the Flight Service rejects it with `409 Conflict`.
* **Subsequent Duplicate Requests**: If a duplicate request is received after completion, the Flight Service intercepts the request in the middleware, retrieves the cached response status and body from `IdempotencyKeys`, and returns it directly without executing any database business logic or updates.

---

## 5. Auth Service APIs

All routes are prefixed with `/api/v1/auth`.

### A. Register User
* **HTTP Method**: `POST`
* **Path**: `/register`
* **Request Body**:
  ```json
  {
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@test.com",
    "password": "Password123!",
    "phoneNumber": "1234567890"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Successfully registered the user",
    "data": {
      "user": {
        "id": 1,
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice@test.com",
        "phoneNumber": "1234567890",
        "status": "ACTIVE",
        "isEmailVerified": false,
        "createdAt": "2026-08-01T00:00:00.000Z",
        "updatedAt": "2026-08-01T00:00:00.000Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx..."
    },
    "error": {}
  }
  ```

### B. Login User
* **HTTP Method**: `POST`
* **Path**: `/login`
* **Request Body**:
  ```json
  {
    "email": "alice@test.com",
    "password": "Password123!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Successfully authenticated the user",
    "data": {
      "user": {
        "id": 1,
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice@test.com",
        "phoneNumber": "1234567890",
        "status": "ACTIVE",
        "isEmailVerified": false,
        "createdAt": "2026-08-01T00:00:00.000Z",
        "updatedAt": "2026-08-01T00:00:00.000Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx..."
    },
    "error": {}
  }
  ```

### C. Get Current User Profile
* **HTTP Method**: `GET`
* **Path**: `/me`
* **Headers**:
  * `Authorization`: `Bearer <Access_Token>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Successfully fetched user profile details",
    "data": {
      "id": 1,
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice@test.com",
      "phoneNumber": "1234567890",
      "status": "ACTIVE",
      "isEmailVerified": false,
      "roles": [
        "CUSTOMER"
      ],
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-01T00:00:00.000Z"
    },
    "error": {}
  }
  ```

### D. Refresh Access Token
* **HTTP Method**: `POST`
* **Path**: `/refresh`
* **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsInNlc3Np..."
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Successfully generated new access token",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsImVtYWls...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsInNlc3Np..."
    },
    "error": {}
  }
  ```
* **Error Response (`401 Unauthorized` - Expired Refresh Token)**:
  ```json
  {
    "success": false,
    "message": "Token refresh failed",
    "data": {},
    "error": {
      "name": "AppError",
      "statusCode": 401,
      "explanation": "Expired refresh token"
    }
  }
  ```
* **Error Response (`401 Unauthorized` - Replay Attack / Already Rotated)**:
  ```json
  {
    "success": false,
    "message": "Token refresh failed",
    "data": {},
    "error": {
      "name": "AppError",
      "statusCode": 401,
      "explanation": "Refresh token already rotated"
    }
  }
  ```

### E. Logout User (Revoke Session)
* **HTTP Method**: `POST`
* **Path**: `/logout`
* **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx..."
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Successfully logged out user and revoked session",
    "data": {
      "success": true
    },
    "error": {}
  }
  ```
* **Error Response (`401 Unauthorized` - Session Already Revoked)**:
  ```json
  {
    "success": false,
    "message": "Logout failed",
    "data": {},
    "error": {
      "name": "AppError",
      "statusCode": 401,
      "explanation": "Session already revoked"
    }
  }
  ```

---

## 6. Request Authentication Contract

Downstream protected endpoints across Booking Service and Flight Service require a verified JSON Web Token (JWT) supplied inside request headers.

### HTTP Headers
* `Authorization`: `Bearer <Access_Token>`

### Reusable Authentication Error Contracts

#### 1. Missing Authorization Header (`401 Unauthorized`)
Returned when the request completely omits the `Authorization` header.
```json
{
  "success": false,
  "message": "Authentication failed",
  "data": {},
  "error": {
    "name": "AppError",
    "statusCode": 401,
    "explanation": "Missing Authorization header"
  }
}
```

#### 2. Invalid Bearer format (`401 Unauthorized`)
Returned when the header is present but does not start with `Bearer `.
```json
{
  "success": false,
  "message": "Authentication failed",
  "data": {},
  "error": {
    "name": "AppError",
    "statusCode": 401,
    "explanation": "Invalid Bearer token format"
  }
}
```

#### 3. Expired Access Token (`401 Unauthorized`)
Returned when the token signature is valid but has expired.
```json
{
  "success": false,
  "message": "Authentication failed",
  "data": {},
  "error": {
    "name": "AppError",
    "statusCode": 401,
    "explanation": "Expired JWT token"
  }
}
```

#### 4. Invalid Signature/Token (`401 Unauthorized`)
Returned when token verification fails due to tampering, key mismatches, or malformed JWT syntax.
```json
{
  "success": false,
  "message": "Authentication failed",
  "data": {},
  "error": {
    "name": "AppError",
    "statusCode": 401,
    "explanation": "Invalid JWT token"
  }
}
```




