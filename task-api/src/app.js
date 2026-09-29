const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Task Manager API is running',
    endpoints: {
      getAllTasks: 'GET /tasks',
      filterByStatus: 'GET /tasks?status=todo',
      paginatedTasks: 'GET /tasks?page=1&limit=10',
      getStats: 'GET /tasks/stats',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id',
      completeTask: 'PATCH /tasks/:id/complete',
      assignTask: 'PATCH /tasks/:id/assign'
    }
  });
});

app.use('/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API running on port ${PORT}`);
  });
}

module.exports = app;
