// tasks-api/index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const USERS_API = process.env.USERS_API_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

// Banco em memória
let tasks = [
  { "id": 1, "userId": 1, "description": "Estudar React", "date": "2025-09-07", "completed": false },
  { "id": 2, "userId": 2, "description": "Revisar API Java", "date": "2025-09-08", "completed": false },
  { "id": 3, "userId": 3, "description": "Organizar repositório no GitHub", "date": "2025-09-09", "completed": false },
  { "id": 4, "userId": 4, "description": "Testar microsserviços no Postman", "date": "2025-09-10", "completed": false }
];

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1;
}

// 🔹 List all tasks
app.get('/tasks', (req, res) => res.json(tasks));

// 🔹 Get task by id
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
  res.json(task);
});

// 🔹 List tasks by user
app.get('/tasks/user/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const userTasks = tasks.filter(t => t.userId === userId);
  res.json(userTasks);
});

// 🔹 Create task (valida se usuário existe chamando Users API)
app.post('/tasks', async (req, res) => {
  try {
    const { userId, description, date } = req.body;
    if (!userId || !description || !description.trim()) {
      return res.status(400).json({ error: 'userId e description são obrigatórios' });
    }

    // valida usuário
    try {
      await axios.get(`${USERS_API}/users/${userId}`);
    } catch (err) {
      return res.status(400).json({ error: 'Usuário inválido (não encontrado)' });
    }

    // se não vier data, usa a data de hoje
    const taskDate = date && date.trim() ? date : new Date().toISOString().split("T")[0];

    const newTask = { 
      id: nextId(tasks), 
      userId: Number(userId), 
      description: description.trim(), 
      date: taskDate, 
      completed: false 
    };

    tasks.push(newTask);
    return res.status(201).json(newTask);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// 🔹 Update task (partial: description, completed, date)
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  const { description, completed, date } = req.body;
  if (description !== undefined) task.description = String(description).trim();
  if (completed !== undefined) task.completed = Boolean(completed);
  if (date !== undefined && date.trim()) task.date = date;

  res.json(task);
});

// 🔹 Delete task
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const prevLen = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  if (tasks.length === prevLen) return res.status(404).json({ error: 'Tarefa não encontrada' });
  res.status(204).send();
});

app.listen(PORT, () => 
  console.log(`✅ Tasks API rodando em http://localhost:${PORT} (Users API: ${USERS_API})`)
);

