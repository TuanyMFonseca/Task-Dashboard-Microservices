// users-api/index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Dados em memória (seed)
let users = [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" },
    { "id": 3, "name": "Carlos" },
    { "id": 4, "name": "Diana" }
];

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1;
}

// List all users
app.get('/users', (req, res) => res.json(users));

// Get user by id
app.get('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// Create user
app.post('/users', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  const newUser = { id: nextId(users), name: name.trim() };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Update user
app.put('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  user.name = name.trim();
  res.json(user);
});

// Delete user
app.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const prev = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length === prev) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.status(204).send();
});

app.listen(PORT, () => console.log(`Users API rodando em http://localhost:${PORT}`));
