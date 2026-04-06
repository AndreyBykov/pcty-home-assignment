# Paylocity Benefits Dashboard — QA Automaton Home Assignment 

UI and API test automation for the Paylocity Benefits Dashboard application, built with [Playwright](https://playwright.dev/) and TypeScript.

## Prerequisites

- **Node.js** ≥ 20
- Credentials and an API auth token (provided separately)

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium

# Create .env from the template and fill in your credentials
cp .env.example .env
```

`.env` must contain:

```
USERNAME=<your_username>
PASSWORD=<your_password>
AUTH_TOKEN=<your_api_auth_token>
```

## Running Tests

```bash
# Run all tests (API + UI)
npm test

# Run only API tests
npx playwright test --project=api

# Run only UI tests
npx playwright test --project=ui-chrome

# Run a specific test file
npx playwright test tests/api/employees.api.spec.ts
```

> **Note:** Tests run **headed** locally by default and **headless** in CI (`CI` env var).  
> Tests run sequentially (`workers: 1`) because the back-end does not handle concurrent requests reliably with a single login.

## Viewing Reports

```bash
npx playwright show-report
```

## Project Structure

```
├── src/
│   ├── config.ts                   # Environment / credentials configuration
│   ├── consts.ts                   # Routes, selectors, business-related constants
│   ├── fixtures.ts                 # Custom Playwright fixtures (seeding, clean-up)
│   ├── utils.ts                    # Shared validation helpers
│   ├── models/
│   │   └── employee.ts             # TypeScript interfaces for API contracts
│   ├── pages/
│   │   ├── base.ts                 # Base page object (login form)
│   │   └── dashboard.ts            # Dashboard page object
│   └── services/
│       └── employee.ts             # API service layer for employee CRUD, data seeding and clean-up
├── tests/
│   ├── api/
│   │   └── employees.api.spec.ts   # API tests (CRUD, auth, validation, calculations)
│   └── ui/
│       ├── auth.spec.ts            # Login / authentication UI tests
│       └── dashboard.spec.ts       # Dashboard CRUD UI tests
├── playwright.config.ts
└── .env.example
```

## Test Design Decisions

- **Per-test login:** Each UI test logs in explicitly instead of sharing a session via `auth.setup.ts`. The back-end is unreliable under concurrency with a single user, so reusing stored auth state caused flaky failures. The disabled setup file is kept for reference.
- **Sequential execution:** `workers: 1` for the same concurrency reason.
- **`test.fail()` for known bugs:** Tests that verify correct behavior but hit known application bugs are wrapped in `test.fail()` with inline comments describing the defect. This keeps the suite green while documenting issues.
- **Fixture-based clean-up:** `seededEmployee` and `employeeIds` fixtures handle test data teardown automatically, so tests don't leave stale records.

## Linting

```bash
npm run lint
npm run lint:fix
```
