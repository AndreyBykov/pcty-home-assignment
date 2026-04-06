# UI Bug Report - Paylocity Benefits Dashboard

---

## BUG-UI-001: Refreshing the page after successful login fails to load data

**Severity:** High

**Description:** After logging in, the dashboard loads correctly with all employee data visible. However, refreshing the page often causes the data to disappear with only the dashboard header remaining. It may take multiple refreshes or a full re-login to restore the data. This is likely related to sticky sessions or server-side routing.

**Steps to reproduce:**
1. Navigate to the login page and log in with valid credentials.
2. Confirm the dashboard loads with employee data visible.
3. Refresh the page (F5 or browser refresh).

**Actual result:** Only the dashboard header is loaded; the employee table is empty.

**Expected result:** Refreshing the page should maintain the session and reload the data normally.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

---

## BUG-UI-002: Visible delay when loading dashboard data (no loading indicator)

**Severity:** Low

**Description:** When navigating to the dashboard, the page header and empty table render immediately, but the actual employee data appears approximately one second later. There is no loading spinner or skeleton placeholder, which makes the page feel broken during the gap.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Observe the page during load.

**Actual result:** The dashboard header renders first; employee rows appear ~1 second later with no visual feedback.

**Expected result:** A loading indicator (spinner, skeleton rows, or similar) should be shown while data is being fetched, or the data should be pre-rendered server-side.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

---

## BUG-UI-003: Inconsistent table row ordering after adding an employee

**Severity:** Medium

**Description:** Newly added employee records appear at inconsistent positions in the table - sometimes at the top, sometimes at the bottom. The placement appears random and there is no explicit sort order or sorting controls on the table.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Add a new employee with valid data and save.
3. Observe the position of the new row in the table.
4. Repeat several times (re-login might be necessarry) - the position may vary between attempts.

**Actual result:** The new record appears at the top of the table in some cases and at the bottom in others.

**Expected result:** Row ordering should be deterministic. Adding to the top (newest first) would be the most intuitive default, given there are no sorting controls.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

---

## BUG-UI-004: Unsanitized input allows stored XSS - script tags saved to database and render as empty fields

**Severity:** High (security risk)

**Description:** The employee modal accepts arbitrary input including HTML/script tags. Submitting a value like `<script>alert('xss')</script>` as a first or last name results in the raw script being stored in the database. When the dashboard reloads, the affected field renders as empty because the browser interprets the tag as HTML rather than text. This is a stored XSS vulnerability.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Click "Add Employee."
3. Enter `<script>alert('xss')</script>` as the First Name; fill in Last Name and Dependents normally.
4. Click "Add."

**Actual result:** The record is saved without any warning. The newly added row shows an empty First Name field.

**Expected result:**
- Front-end validation should reject or escape HTML/script input before submission (ideally disabling the Save button for invalid input).
- Back-end should sanitize or reject payloads containing executable script tags.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

**Related:** BUG-UI-005, BUG-API-003

---

## BUG-UI-005: Employee modal does not show validation errors for invalid input

**Severity:** Medium

**Description:** The employee modal has no front-end validation. Submitting empty fields, non-numeric dependents, or out-of-range values (negative, >32) results in the back-end silently rejecting the request - no error message is displayed to the user, and the modal remains open with no feedback.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Click "Add Employee."
3. Leave the Last Name field empty; fill in only the First Name.
4. Click "Add."

**Actual result:** The record is not saved, but no validation error is shown. The modal stays open with no feedback.

**Expected result:** Front-end validation errors should be displayed inline (e.g., "Last Name is required," "Dependents must be between 0 and 32"), and the form should not submit invalid data to the back-end.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

**Related:** BUG-UI-004

---

## BUG-UI-006: Modal title says "Add Employee" when editing an existing employee

**Severity:** Low

**Description:** The same modal is used for adding and editing employees. When editing, the action button correctly changes from "Add" to "Update," but the modal title still reads "Add Employee."

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Click the Edit (pencil) icon on an existing employee row.
3. Observe the modal title.

**Actual result:** Modal title says "Add Employee."

**Expected result:** Modal title should say "Edit Employee" or "Update Employee."

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178

---

## BUG-UI-007: Cannot add an employee without explicitly entering 0 for Dependents

**Severity:** Low

**Description:** The Dependents field in the employee modal is required. If left empty, the form submits `null` for dependents, and the back-end rejects the request silently with a 405 error. The API defaults to 0 when the field is omitted in direct API calls, but the UI does not mirror this behavior, creating unnecessary friction.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Click "Add Employee."
3. Fill in First Name and Last Name; leave Dependents empty.
4. Click "Add."

**Actual result:** The record is not saved. The API call fails with a 405 error (no feedback shown to user - see BUG-UI-005).

**Expected result:** The Dependents field should default to 0 when left empty, consistent with the API behavior.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178

---

## BUG-UI-008: Direct navigation to dashboard without login shows empty dashboard instead of redirecting to login page

**Severity:** Medium

**Description:** Navigating directly to the dashboard URL without being logged in loads the dashboard page with an empty table (header only, no data). The application does not redirect to the login page. While no actual data is exposed, this is misleading and a poor user experience.

**Steps to reproduce:**
1. Open an incognito/private browser window (ensure no prior session exists).
2. Navigate directly to the dashboard URL.

**Actual result:** The dashboard page loads with an empty table and no prompt to log in.

**Expected result:** The application should redirect unauthenticated users to the login page.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178 / Node.js 24.14.1 + Playwright 1.59.1 + Chrome for Testing 147.0.7727.15 (arm64)

---

## BUG-UI-009: Redundant GET request after every create/update/delete operation (performance concern)

**Severity:** Low

**Note:** Not strictly a bug - this is a performance/architecture concern.

**Description:** Every mutation (POST, PUT, DELETE) is immediately followed by a GET request that re-fetches the entire employee list. POST and PUT responses already contain the created/updated record, making the subsequent GET redundant. While this has minimal impact with a small number of records, it could become a performance bottleneck as the dataset grows.

**Steps to reproduce:**
1. Navigate to the dashboard (login if necessary).
2. Open the browser DevTools Network tab.
3. Create, update, or delete an employee record.
4. Observe that a GET request to the employees endpoint fires immediately after the mutation.

**Actual result:** A full list GET request is sent after every mutation, regardless of whether the response already contains the needed data.

**Expected result:** The dashboard should update optimistically using the mutation response data, avoiding redundant network requests.

**Environment:** macOS 26.3.1 (arm) + Desktop Chromium 146.0.7680.178
