const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('App Routes and Middleware', () => {
  test('GET / returns welcome message and endpoint index', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task Manager API is running');
    expect(res.body.endpoints).toBeDefined();
  });

  test('returns 500 internal server error when an unhandled exception occurs in a route', async () => {
    const spy = jest.spyOn(taskService, 'getAll').mockImplementationOnce(() => {
      throw new Error('Database error simulation');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
