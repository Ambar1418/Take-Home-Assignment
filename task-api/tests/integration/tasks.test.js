const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('returns empty list when no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('filters tasks by status', async () => {
      taskService.create({ title: 'Todo Task', status: 'todo' });
      taskService.create({ title: 'Done Task', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Todo Task');
    });

    test('returns empty array when filtering by status with no matches', async () => {
      taskService.create({ title: 'Todo Task', status: 'todo' });

      const res = await request(app).get('/tasks?status=done');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('paginates list of tasks with page and limit', async () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');

      const res2 = await request(app).get('/tasks?page=2&limit=2');
      expect(res2.status).toBe(200);
      expect(res2.body).toHaveLength(2);
      expect(res2.body[0].title).toBe('Task 3');
      expect(res2.body[1].title).toBe('Task 4');
    });

    test('handles combining status filter AND pagination', async () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Todo ${i}`, status: 'todo' });
      }
      taskService.create({ title: 'Done Task', status: 'done' });

      const res = await request(app).get('/tasks?status=todo&page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Todo 1');
      expect(res.body[1].title).toBe('Todo 2');
    });

    test('handles invalid page or limit query parameters safely', async () => {
      taskService.create({ title: 'Task 1' });
      const res = await request(app).get('/tasks?page=invalid&limit=-5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /tasks/stats', () => {
    test('returns task statistics including overdue tasks', async () => {
      const pastDate = new Date(Date.now() - 100000).toISOString();
      taskService.create({ title: 'Task 1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Task 2', status: 'done', dueDate: pastDate });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 1,
      });
    });
  });

  describe('POST /tasks', () => {
    test('creates a new task with valid data', async () => {
      const payload = {
        title: 'New Feature Task',
        description: 'Build user auth',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59.000Z',
      };

      const res = await request(app).post('/tasks').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Feature Task');
      expect(res.body.description).toBe('Build user auth');
      expect(res.body.status).toBe('in_progress');
      expect(res.body.priority).toBe('high');
      expect(res.body.dueDate).toBe('2026-12-31T23:59:59.000Z');
      expect(res.body.assignee).toBeNull();
    });

    test('returns 400 error when title is missing', async () => {
      const res = await request(app).post('/tasks').send({ description: 'No title' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('title is required');
    });

    test('returns 400 error when status is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', status: 'unknown' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    test('returns 400 error when priority is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', priority: 'ultra' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });

    test('returns 400 error when dueDate is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', dueDate: 'invalid-date' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates task details successfully', async () => {
      const created = taskService.create({ title: 'Old Title', priority: 'low' });

      const res = await request(app)
        .put(`/tasks/${created.id}`)
        .send({ title: 'Updated Title', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.priority).toBe('high');
    });

    test('returns 404 when updating non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    test('returns 400 when updating with invalid data', async () => {
      const created = taskService.create({ title: 'Valid Task' });

      const res = await request(app)
        .put(`/tasks/${created.id}`)
        .send({ priority: 'super_high' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes task successfully and returns 204', async () => {
      const created = taskService.create({ title: 'To Delete' });

      const res = await request(app).delete(`/tasks/${created.id}`);
      expect(res.status).toBe(204);

      const fetchRes = await request(app).get('/tasks');
      expect(fetchRes.body).toHaveLength(0);
    });

    test('returns 404 when deleting non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks task as completed', async () => {
      const created = taskService.create({ title: 'Task to Complete', priority: 'high' });

      const res = await request(app).patch(`/tasks/${created.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeDefined();
      expect(res.body.priority).toBe('high'); // Priority should be retained!
    });

    test('returns 404 when completing non-existent task', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('assigns task to a user', async () => {
      const created = taskService.create({ title: 'Task to Assign' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: 'Bob' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Bob');
    });

    test('returns 404 when assigning non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Bob' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    test('returns 400 when assignee is missing or empty', async () => {
      const created = taskService.create({ title: 'Task' });

      const res1 = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({});
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: '   ' });
      expect(res2.status).toBe(400);
    });
  });
});
