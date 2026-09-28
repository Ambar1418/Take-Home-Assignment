const taskService = require('../../src/services/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create and findById / getAll', () => {
    test('creates a task with defaults and returns it', () => {
      const task = taskService.create({ title: 'Task 1' });
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Task 1');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.assignee).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    test('creates a task with custom fields', () => {
      const task = taskService.create({
        title: 'Task 2',
        description: 'Description 2',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T00:00:00.000Z',
      });
      expect(task.title).toBe('Task 2');
      expect(task.description).toBe('Description 2');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe('2026-12-31T00:00:00.000Z');
    });

    test('getAll returns all created tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
    });

    test('findById returns matching task or undefined', () => {
      const created = taskService.create({ title: 'Target Task' });
      const found = taskService.findById(created.id);
      expect(found).toEqual(created);

      const notFound = taskService.findById('non-existent-id');
      expect(notFound).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('filters tasks strictly by status', () => {
      taskService.create({ title: 'Task Todo', status: 'todo' });
      taskService.create({ title: 'Task InProgress', status: 'in_progress' });
      taskService.create({ title: 'Task Done', status: 'done' });

      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe('Task Todo');

      const doneTasks = taskService.getByStatus('done');
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].title).toBe('Task Done');

      const doTasks = taskService.getByStatus('do');
      // Searching status 'do' should not return 'todo' or 'done' if exact status match is used
      expect(doTasks).toHaveLength(0);
    });
  });

  describe('getPaginated', () => {
    test('returns correct slice for 1-based page indexing', () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      // Page 1, limit 2 => Tasks 1 and 2 (indexes 0, 1)
      const page1 = taskService.getPaginated(1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      // Page 2, limit 2 => Tasks 3 and 4 (indexes 2, 3)
      const page2 = taskService.getPaginated(2, 2);
      expect(page2).toHaveLength(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');

      // Page 3, limit 2 => Task 5 (index 4)
      const page3 = taskService.getPaginated(3, 2);
      expect(page3).toHaveLength(1);
      expect(page3[0].title).toBe('Task 5');

      // Page 4, limit 2 => Empty array
      const page4 = taskService.getPaginated(4, 2);
      expect(page4).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    test('calculates counts by status and overdue count', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day in future

      taskService.create({ title: 'T1', status: 'todo', dueDate: pastDate }); // overdue
      taskService.create({ title: 'T2', status: 'in_progress', dueDate: pastDate }); // overdue
      taskService.create({ title: 'T3', status: 'done', dueDate: pastDate }); // done (not overdue)
      taskService.create({ title: 'T4', status: 'todo', dueDate: futureDate }); // future (not overdue)
      taskService.create({ title: 'T5', status: 'todo', dueDate: null }); // no due date (not overdue)

      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 3,
        in_progress: 1,
        done: 1,
        overdue: 2,
      });
    });
  });

  describe('update', () => {
    test('updates allowed fields of existing task', () => {
      const task = taskService.create({ title: 'Original Title', priority: 'low' });
      const updated = taskService.update(task.id, { title: 'Updated Title', priority: 'high' });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(updated.id).toBe(task.id);
    });

    test('prevents overwriting system fields like id and createdAt', () => {
      const task = taskService.create({ title: 'Task' });
      const originalCreatedAt = task.createdAt;

      const updated = taskService.update(task.id, {
        id: 'hacked-id',
        createdAt: '1970-01-01T00:00:00.000Z',
        title: 'Safe Title',
      });

      expect(updated.id).toBe(task.id);
      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.title).toBe('Safe Title');
    });

    test('returns null for non-existent task', () => {
      const result = taskService.update('non-existent-id', { title: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('completeTask', () => {
    test('marks task as done and sets completedAt timestamp without altering priority', () => {
      const task = taskService.create({ title: 'High Priority Task', priority: 'high', status: 'todo' });
      const completed = taskService.completeTask(task.id);

      expect(completed).toBeDefined();
      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('high'); // Should keep 'high' priority!
      expect(completed.completedAt).toBeDefined();
      expect(new Date(completed.completedAt).getTime()).not.toBeNaN();
    });

    test('returns null if task not found', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    test('assigns task to a user and returns updated task', () => {
      const task = taskService.create({ title: 'Task to assign' });
      const assigned = taskService.assignTask(task.id, 'Alice');

      expect(assigned).toBeDefined();
      expect(assigned.assignee).toBe('Alice');
    });

    test('returns null if task to assign does not exist', () => {
      const result = taskService.assignTask('non-existent-id', 'Alice');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    test('removes existing task and returns true', () => {
      const task = taskService.create({ title: 'Task to delete' });
      const deleted = taskService.remove(task.id);

      expect(deleted).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('returns false when trying to delete non-existent task', () => {
      const deleted = taskService.remove('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
