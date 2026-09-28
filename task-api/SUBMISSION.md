# Submission Notes — Task Manager API

## Overview
This submission completes the Task Manager API take-home assignment. All existing functionality has been tested, 6 distinct bugs were identified and fixed, and the new task assignment feature (`PATCH /tasks/:id/assign`) has been fully implemented with complete test coverage.

---

## Deliverables Summary

1. **Comprehensive Test Suite & Coverage**:
   - **4 Test Suites / 62 Tests** (100% passing).
   - **98.78% Statement Coverage** across the entire project (100% on `routes`, `services`, and `validators`).
   - Unit tests covering `taskService.js` and `validators.js`.
   - Integration tests covering all REST API endpoints using Supertest.

2. **Bug Report (`BUG_REPORT.md`)**:
   - Documents 6 bugs found during test development, including expected behavior, actual behavior, discovery method, and applied fixes.

3. **Bug Fixes**:
   - **Exact Status Filtering**: Fixed substring matching bug in `getByStatus`.
   - **Correct 1-Based Pagination**: Fixed off-by-one error in offset computation in `getPaginated`.
   - **Preserved Priority on Completion**: Fixed priority overwrite in `completeTask`.
   - **Combined Filtering & Pagination**: Refactored `GET /tasks` to support both `status` filter and `page`/`limit` pagination concurrently.
   - **Protected System Fields**: Sanitized `PUT /tasks/:id` to prevent mutation of read-only fields (`id`, `createdAt`).
   - **Validator Crash Protection**: Added type checks for null/undefined/non-object request bodies.

4. **New Feature (`PATCH /tasks/:id/assign`)**:
   - Endpoint: `PATCH /tasks/:id/assign`
   - Request Body: `{ "assignee": "string" }`
   - Validates that `assignee` is a non-empty, trimmed string (returns 400 Bad Request otherwise).
   - Updates task's `assignee` field and returns the updated task object.
   - Returns 404 Not Found if task ID does not exist.
   - Initialized `assignee: null` for newly created tasks.

---

## Reflection & Production Readiness

### 1. What would you test next if you had more time?
- **Concurrency & Race Conditions**: Test behavior under concurrent updates/deletions to the in-memory array or database store.
- **Payload Limits & Input Sanitization**: Test extremely large request bodies, malicious strings (XSS/SQLi injection attempts if persistent DB is attached), and unexpected UTF-8 characters in titles/assignee names.
- **Performance Benchmarks & Load Testing**: Profile memory usage and latency with large datasets (10k+ tasks) to evaluate pagination efficiency.
- **Contract / Schema Validation Testing**: Introduce JSON Schema or Zod validation tests to ensure standard error formats across all endpoints.

### 2. Anything that surprised you in the codebase?
- `taskService.completeTask` explicitly reset the task priority to `'medium'`, which would silently degrade priority visibility for critical tasks upon completion.
- `getByStatus` used `Array.prototype.includes` on string statuses, meaning `/tasks?status=do` would return both `todo` and `done` tasks.
- Pagination used 0-based offset multiplication with 1-based page parameters, causing `page=1` to skip the first batch of tasks entirely.

### 3. Questions to ask before shipping to production?
- **Persistence Strategy**: What database (PostgreSQL, MongoDB, DynamoDB) will be used for persistent storage, and how should database transactions/locking be structured?
- **Authentication & Authorization**: How should user identities be authenticated (JWT, OAuth2), and who is allowed to edit or assign tasks (RBAC / ownership rules)?
- **Audit Trails / History**: Do we need to record historical state changes (e.g. who completed or assigned a task and when)?
- **Rate Limiting & Security Headers**: What rate limiting (e.g. `express-rate-limit`) and security middleware (`helmet`, CORS configuration) should be added to the production stack?
