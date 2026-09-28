const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('App Error Handling Middleware', () => {
  test('returns 500 internal server error when an unhandled exception occurs in a route', async () => {
    // Spy on taskService.getAll to throw an error
    const spy = jest.spyOn(taskService, 'getAll').mockImplementationOnce(() => {
      throw new Error('Database error simulation');
    });

    // Console.error spy to prevent cluttering test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
