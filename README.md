# Rate Limiting Middleware (Sliding Window)

This repository implements a **rate limiting middleware** using the **Sliding Window** algorithm backed by **Redis**.  
It supports **user-based** and **IP-based** rate limiting, integrates with **JWT authentication**, and exposes standard **rate limit response headers**.

---

## Features

- Sliding Window rate limiting algorithm
- Redis-backed request tracking
- JWT-based user identification
- IP-based fallback for unauthenticated users
- Configurable limits via environment variables
- Graceful handling of Redis downtime
- Standard `X-RateLimit-*` headers
- HTTP `429 Too Many Requests` response on limit breach

---

## Workflow Overview

### Step 1: Generate `rate_limit_key`
### Step 2: Check if request is allowed
### Step 3: Set response headers and allow/reject request

---

## Step 1: Generation of `rate_limit_key`

The rate limiting key determines how requests are grouped.

### Process

1. Get client IP address
2. Authenticate user using JWT access token
3. Determine authentication status:
   - **Authenticated user**  
     ```
     rate_limit_key = RATE_LIMIT_USER_ID
     ```
   - **Unauthenticated user**  
     ```
     rate_limit_key = RATE_LIMIT_IP_ADDRESS
     ```

This ensures fair usage by authenticated users while protecting public endpoints via IP-based limits.

---

## Step 2: Check if Request Is Allowed

A **SlidingWindowRateLimiter** instance is created:

```ts
const limiter: IRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.REQUESTS_LIMIT_PER_WINDOW || 10),
  Number(process.env.RATE_LIMIT_WINDOW_MS || 60)
);

const isAllowed = await limiter.shouldProceed(rateLimitKey);

shouldProceed(key)

Get Redis instance

If Redis is down:

Allow or reject based on ALLOW_REQUESTS_IF_REDIS_DOWN (default: reject)

If Redis is up:

Use Redis LIST storing request timestamps

Remove expired timestamps

Allow if listSize < REQUESTS_LIMIT_PER_WINDOW
```

## Step 3: Set Response Headers and Handle Request Outcome

Once the rate-limit decision is made, the middleware sets standard response headers and either allows or rejects the request.

### Response Headers

The following headers are added to every response:

- **X-RateLimit-Limit**  
  The maximum number of requests allowed per window.

- **X-RateLimit-Remaining**  
  The number of remaining requests in the current window.

---

### Request Handling

- **When the request exceeds the rate limit**  
  The request is rejected with HTTP status code **429 (Too Many Requests)** and a descriptive error message.

- **When the request is within the rate limit**  
  The request is forwarded to the next middleware or route handler.

---

## Sliding Window Logic (Redis)

The sliding window algorithm is implemented using Redis.

### Data Model

- **Key**: `rateLimitKey`
- **Type**: Redis `LIST`
- **Value**: Epoch timestamps of requests
- **Ordering**:
  - Head → Oldest request
  - Tail → Newest request

### Behavior

- Expired timestamps outside the configured window are removed on each request.
- If the number of timestamps in the list is less than the allowed request limit, the current request is recorded and allowed.
- If the limit is reached, the request is rejected.

---

## Environment Variables

The following environment variables control the rate limiter behavior:

| Variable                       | Default | Description                                    |
| ------------------------------ | ------- | ---------------------------------------------- |
| `REQUESTS_LIMIT_PER_WINDOW`    | `10`    | Maximum number of requests per window          |
| `RATE_LIMIT_WINDOW_MS`         | `60`    | Sliding window duration in milliseconds        |
| `ALLOW_REQUESTS_IF_REDIS_DOWN` | `false` | Allow requests when Redis is unavailable       |
