# Bug Report — Task Manager API

This document details the bugs identified during testing of the Task Manager API codebase, including steps to reproduce, root causes, and recommended fixes.

---

## 1. Substring Matching in Status Filtering

- **Endpoint / Function:** `GET /tasks?status=...` / `taskService.getByStatus(status)`
- **Expected Behavior:** Filtering tasks by status should perform an exact match against the task status field (`'todo'`, `'in_progress'`, or `'done'`).
- **Actual Behavior:** `getByStatus` uses `tasks.filter((t) => t.status.includes(status))`. Querying `status=do` returns tasks with status `"todo"` AND `"done"`. Querying `status=to` returns `"todo"` tasks.
- **How Discovered:** Unit test in `taskService.test.js` calling `taskService.getByStatus('do')` returned 2 tasks instead of 0.
- **Fix:** Replace substring check `t.status.includes(status)` with exact equality `t.status === status`.

---

## 2. Off-by-One Error in Pagination Offset Calculation

- **Endpoint / Function:** `GET /tasks?page=...&limit=...` / `taskService.getPaginated(page, limit)`
- **Expected Behavior:** `page=1` with `limit=10` should return the first page of results (items 1–10, array indexes 0–9).
- **Actual Behavior:** Offset is calculated as `const offset = page * limit;`. For `page=1` and `limit=10`, `offset = 10`, skipping the first 10 items (indexes 0–9) and returning items starting at index 10.
- **How Discovered:** Integration test `GET /tasks?page=1&limit=2` returned `Task 3` instead of `Task 1`.
- **Fix:** Update offset calculation to `const offset = Math.max(0, (page - 1) * limit);`.

---

## 3. Priority Reset to `'medium'` on Task Completion

- **Endpoint / Function:** `PATCH /tasks/:id/complete` / `taskService.completeTask(id)`
- **Expected Behavior:** Completing a task should update its `status` to `'done'` and record `completedAt`, keeping the task's existing priority intact.
- **Actual Behavior:** `completeTask` hardcodes `priority: 'medium'` in the updated task object, downgrading `high` priority tasks to `medium` upon completion.
- **How Discovered:** Unit and integration tests completing a task created with `priority: 'high'` returned `priority: 'medium'`.
- **Fix:** Remove `priority: 'medium'` from the returned object in `completeTask()`.

---

## 4. Status Filter Overrides Pagination Query Parameters

- **Endpoint / Function:** `GET /tasks` route handler (`src/routes/tasks.js`)
- **Expected Behavior:** Providing both `status` and `page`/`limit` (e.g. `GET /tasks?status=todo&page=1&limit=2`) should return a paginated slice of tasks filtered by status.
- **Actual Behavior:** The `if (status)` block returns early before checking `page` or `limit`, ignoring pagination whenever a status filter is present.
- **How Discovered:** Integration test calling `GET /tasks?status=todo&page=1&limit=2` returned all 5 todo tasks instead of 2.
- **Fix:** Refactor `GET /tasks` route to filter by status first (if provided) and then apply pagination parameters to the resulting set.

---

## 5. Unrestricted Field Mutation in Task Updates

- **Endpoint / Function:** `PUT /tasks/:id` / `taskService.update(id, fields)`
- **Expected Behavior:** Updating a task should only allow modifying mutable task attributes (`title`, `description`, `status`, `priority`, `dueDate`, `assignee`) and must protect read-only system metadata (`id`, `createdAt`).
- **Actual Behavior:** `taskService.update` merges `{ ...tasks[index], ...fields }` directly, allowing clients to overwrite task `id` and `createdAt` timestamps.
- **How Discovered:** Unit test passing `{ id: 'hacked-id' }` to `taskService.update()` altered the task's immutable ID.
- **Fix:** Explicitly strip or ignore `id` and `createdAt` from fields when applying updates in `taskService.update()`.

---

## 6. Unhandled `TypeError` on Null or Non-Object Validator Input

- **Endpoint / Function:** `src/utils/validators.js` (`validateCreateTask`, `validateUpdateTask`)
- **Expected Behavior:** Passing `null`, `undefined`, or non-object payloads should return a clear validation error message (e.g. `"request body is required"`).
- **Actual Behavior:** Property access on `null` or `undefined` throws an unhandled `TypeError: Cannot read properties of null`.
- **How Discovered:** Unit test calling `validateCreateTask(null)` resulted in an unhandled exception.
- **Fix:** Add check at top of validator functions: `if (!body || typeof body !== 'object') return 'request body is required and must be an object';`.
