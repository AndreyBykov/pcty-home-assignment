# QA Automaton Home Assignment - Paylocity Benefits Dashboard 

---

UI and API test automation for the Paylocity Benefits Dashboard application, built with [Playwright](https://playwright.dev/) and TypeScript.

## Prerequisites

- **Node.js** ≥ 20
- Credentials and API auth token (provided separately)

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

- **Per-test login:** Each UI test logs in through the UI instead of sharing a saved session via `auth.setup.ts`. The back-end is unreliable under concurrency with a single user, so reusing stored auth state caused flaky failures. The disabled setup file (`auth.setup.ts`) is kept for reference - once the concurrency issues on the back-end are resolved, the intended flow is to use Playwright's [setup project](https://playwright.dev/docs/auth) to authenticate once, persist the session, and remove the explicit login from every test.
- **Sequential execution:** `workers: 1` for the same concurrency reason.
- **Real UI flows over API shortcuts:** An alternative approach would be to skip UI login entirely and inject the API auth token directly into requests (e.g., via `storageState` or request interception). This is not done intentionally - routing through the actual UI login ensures we exercise the full authentication flow and catch bugs that would be invisible if we bypassed it (e.g., the 405 error on invalid credentials, missing redirect for unauthenticated access, etc).
- **Auth token expiration:** The current setup assumes a static token provided via `.env`. In a production project, a token refresh mechanism would be needed to handle expiration - e.g., a fixture or setup step that re-authenticates and updates the token before each run.
- **Single browser (Chromium):** Tests currently run against Chromium only. This is sufficient for the scope of a home assignment; in a real project the browser matrix would be expanded based on business requirements and target audience (e.g., adding Firefox, WebKit, mobile viewports).
- **`test.fail()` for known bugs:** Tests that verify correct behavior but hit known application bugs are wrapped in `test.fail()` with inline comments describing the defect. This keeps the suite green while documenting issues.
- **Fixture-based clean-up:** `seededEmployee` and `employeeIds` fixtures handle test data teardown automatically, so tests don't leave stale records.

## CI

GitHub Actions workflows run on every push and PR to `main`/`master`:

- **Playwright Tests** - runs the full test suite (API + UI) on Ubuntu with headless Chromium, uploads the HTML report as an artifact.
- **Lint & Format** - runs ESLint to check code quality and formatting.

Credentials are stored as GitHub Actions secrets (`USERNAME`, `PASSWORD`, `AUTH_TOKEN`).

## Linting

```bash
npm run lint
npm run lint:fix
```
