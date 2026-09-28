const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../../src/utils/validators');

describe('Validators Unit Tests', () => {
  describe('validateCreateTask', () => {
    test('returns null for a valid task with minimal required fields', () => {
      const result = validateCreateTask({ title: 'Test Task' });
      expect(result).toBeNull();
    });

    test('returns null for a valid task with all fields', () => {
      const result = validateCreateTask({
        title: 'Full Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59.000Z',
      });
      expect(result).toBeNull();
    });

    test('returns error if body is missing, null, or not an object', () => {
      expect(validateCreateTask(null)).toContain('request body is required');
      expect(validateCreateTask(undefined)).toContain('request body is required');
      expect(validateCreateTask('string')).toContain('request body is required');
    });

    test('returns error if title is missing', () => {
      const result = validateCreateTask({ description: 'No title' });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error if title is not a string', () => {
      const result = validateCreateTask({ title: 12345 });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error if title is whitespace only', () => {
      const result = validateCreateTask({ title: '   ' });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error if status is invalid', () => {
      const result = validateCreateTask({ title: 'Task', status: 'invalid_status' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('returns error if priority is invalid', () => {
      const result = validateCreateTask({ title: 'Task', priority: 'urgent' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('returns error if dueDate is invalid ISO string', () => {
      const result = validateCreateTask({ title: 'Task', dueDate: 'invalid-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });

    test('accepts null or valid ISO string for dueDate', () => {
      expect(validateCreateTask({ title: 'Task', dueDate: null })).toBeNull();
      expect(validateCreateTask({ title: 'Task', dueDate: '2026-05-01T00:00:00Z' })).toBeNull();
    });
  });

  describe('validateUpdateTask', () => {
    test('returns null for an empty update object', () => {
      const result = validateUpdateTask({});
      expect(result).toBeNull();
    });

    test('returns null for valid field updates', () => {
      const result = validateUpdateTask({
        title: 'Updated Title',
        status: 'done',
        priority: 'low',
        dueDate: '2026-10-10T10:10:10.000Z',
      });
      expect(result).toBeNull();
    });

    test('returns error if body is missing, null, or not an object', () => {
      expect(validateUpdateTask(null)).toContain('request body is required');
      expect(validateUpdateTask(undefined)).toContain('request body is required');
    });

    test('returns error if updating title to empty string or non-string', () => {
      expect(validateUpdateTask({ title: '' })).toBe('title must be a non-empty string');
      expect(validateUpdateTask({ title: '   ' })).toBe('title must be a non-empty string');
      expect(validateUpdateTask({ title: 123 })).toBe('title must be a non-empty string');
    });

    test('returns error if updating status to invalid value', () => {
      const result = validateUpdateTask({ status: 'completed' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('returns error if updating priority to invalid value', () => {
      const result = validateUpdateTask({ priority: 'critical' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('returns error if updating dueDate to invalid date string', () => {
      const result = validateUpdateTask({ dueDate: 'not-a-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateAssignTask', () => {
    test('returns null for a valid assignee string', () => {
      const result = validateAssignTask({ assignee: 'Alice' });
      expect(result).toBeNull();
    });

    test('returns error if body is missing or null', () => {
      expect(validateAssignTask(null)).toBe('request body is required');
      expect(validateAssignTask(undefined)).toBe('request body is required');
    });

    test('returns error if assignee field is missing', () => {
      const result = validateAssignTask({});
      expect(result).toBe('assignee is required and must be a non-empty string');
    });

    test('returns error if assignee is not a string', () => {
      const result = validateAssignTask({ assignee: 123 });
      expect(result).toBe('assignee is required and must be a non-empty string');
    });

    test('returns error if assignee is an empty or whitespace string', () => {
      expect(validateAssignTask({ assignee: '' })).toBe('assignee is required and must be a non-empty string');
      expect(validateAssignTask({ assignee: '   ' })).toBe('assignee is required and must be a non-empty string');
    });
  });
});
