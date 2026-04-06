# API Bug Report - Paylocity Benefits Dashboard

---

## BUG-API-001: Incorrect HTTP status codes for multiple endpoints

**Severity:** Medium

**Description:** Several API endpoints return incorrect HTTP status codes:
- **POST** `/api/employees` returns `200 OK` on successful creation instead of `201 Created`.
- **GET** `/api/employees/{id}` returns `200 OK` with an empty body for non-existent records instead of `404 Not Found`.
- **DELETE** `/api/employees/{id}` returns `200 OK` with an empty body for non-existent records instead of `404 Not Found`.

This makes it impossible for API consumers to distinguish between a successful operation and a "not found" scenario.

**Steps to reproduce:**

1. Send `POST /Prod/api/employees` with valid data - observe `200` instead of `201`.
2. Send `GET /Prod/api/employees/{non-existent-uuid}` - observe `200` with an empty response body instead of `404`.
3. Send `DELETE /Prod/api/employees/{non-existent-uuid}` - observe `200` with an empty response body instead of `404`.

**Actual result:** All three cases return `200 OK`.

**Expected result:**
- Successful POST should return `201 Created`.
- GET/DELETE for non-existent records should return `404 Not Found`.

**Environment:** Postman 12.5.0 / Node.js 24.14.1 + Playwright 1.59.1

---

## BUG-API-002: PUT with non-existent ID creates a new record with broken calculations

**Severity:** High

**Description:** Sending a PUT request with a non-existent employee ID does not return `404 Not Found`. Instead, it creates a new record with a newly generated ID (ignoring the provided ID), sets `salary` and `gross` to `0`, and calculates a **negative** `net` pay. This leads to data inconsistency in both the database and the UI.

**Steps to reproduce:**

Send a PUT request with a non-existent UUID:

```bash
PUT /Prod/api/employees
Authorization: Basic *****
Content-Type: application/json

{
  "id": "dccd93cb-c958-52d8-7151-8c8b7b7c612d",
  "firstName": "Test",
  "lastName": "User",
  "dependants": 3
}
```

**Actual result:** `200 OK` with a new record created:

```json
{
    "partitionKey": "TestUser520",
    "sortKey": "a92e497f-03ad-4f4f-b0e0-abd8fa29385f",
    "username": "TestUser520",
    "id": "a92e497f-03ad-4f4f-b0e0-abd8fa29385f",
    "firstName": "Test",
    "lastName": "User",
    "dependants": 3,
    "salary": 0,
    "gross": 0,
    "benefitsCost": 96.153854,
    "net": -96.153854
}
```

Note: the provided `id` is ignored, a new `id` is assigned, and `salary`/`gross` are `0`, resulting in negative `net`.

**Expected result:** The API should return `404 Not Found` when the provided ID does not match an existing record.

**Environment:** Postman 12.5.0 / Node.js 24.14.1 + Playwright 1.59.1

---

## BUG-API-003: POST/PUT input is not sanitized - stored XSS vulnerability

**Severity:** High (security risk)

**Description:** The API accepts and stores arbitrary HTML and script tags in employee name fields without sanitization or validation. Submitting `<script>alert("xss")</script>` as a first or last name results in the raw script being persisted in the database. This is a stored XSS vulnerability - the payload is served back to any client that fetches the record.

**Steps to reproduce:**

```bash
POST /Prod/api/employees
Authorization: Basic *****
Content-Type: application/json

{
  "firstName": "<script>alert(\"xss\")</script>",
  "lastName": "<script>alert(\"xss\")</script>",
  "dependants": 1
}
```

**Actual result:** `200 OK` - the record is created with unsanitized script tags stored as-is:

```json
{
    "partitionKey": "TestUser520",
    "sortKey": "5569980a-8d0e-4abb-8749-929c886e465b",
    "username": "TestUser520",
    "id": "5569980a-8d0e-4abb-8749-929c886e465b",
    "firstName": "<script>alert(\"xss\")</script>",
    "lastName": "<script>alert(\"xss\")</script>",
    "dependants": 1,
    "salary": 52000,
    "gross": 2000,
    "benefitsCost": 57.69231,
    "net": 1942.3077
}
```

**Expected result:** The API should either escape HTML entities before storage or reject payloads containing executable script tags with a `400 Bad Request` and a descriptive validation error.

**Environment:** Postman 12.5.0 / Node.js 24.14.1 + Playwright 1.59.1

**Related:** BUG-UI-004

---

## BUG-API-004: Concurrent logins invalidate active sessions, breaking multi-device workflows

**Severity:** Medium

**Description:** Logging in from a second device or browser immediately invalidates the session on the first. This breaks common multi-device workflows (e.g., switching between desktop and mobile) and creates unnecessary friction for end users.

**Steps to reproduce:**
1. Log in to the dashboard from Device A (e.g., desktop browser).
2. Confirm the dashboard loads with employee data.
3. Log in to the dashboard from Device B (e.g., mobile or incognito window).
4. Confirm the dashboard loads with employee data on Device B.
5. Return to Device A and attempt to interact with the dashboard.

**Actual result:** The session on Device A is invalidated; the user must re-login.

**Expected result:** Multiple concurrent sessions should be supported for the same user account.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178

---

## BUG-API-005: Login with invalid credentials crashes the application (error 405)

**Severity:** High

**Description:** Submitting the login form with incorrect (but non-empty) credentials causes the application to crash entirely, displaying an HTTP 405 error page. In contrast, submitting the form with empty fields correctly displays inline validation errors. The application should handle invalid credentials gracefully in both cases.

**Steps to reproduce:**
1. Navigate to the login page.
2. Enter an incorrect username and password (e.g., "Wrong" / "Credentials").
3. Click "Log In."

**Actual result:** The application crashes and displays an error 405 page.

**Expected result:** The login form should remain visible and display a validation error such as "Invalid username or password."

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

---

## BUG-API-006: "Dependant" vs "Dependent" spelling inconsistency between API and UI

**Severity:** Low

**Description:** The UI uses the American English spelling "Dependent" (table column header), while the API uses the British English spelling "dependant" (request/response field name: `dependants`). This inconsistency can cause confusion for developers integrating with the API and increases the likelihood of typos in client code.

**Steps to reproduce:**
1. Observe the dashboard table column header: "Dependent."
2. Inspect any API response (e.g., `GET /Prod/api/employees`): the field is named `dependants`.

**Actual result:** The UI says "Dependent"; the API uses `dependants`.

**Expected result:** A single consistent spelling should be used across the UI and API. "Dependent" (American English) is recommended to align with business terminology.

**Environment:** Postman 12.5.0 / macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)
