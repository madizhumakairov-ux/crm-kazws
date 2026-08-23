const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all tasks
router.get('/', (req, res) => {
  try {
    const { status, priority, contact_id, deal_id } = req.query;
    let query = `
      SELECT t.*, c.first_name || ' ' || c.last_name as contact_name, d.title as deal_title
      FROM tasks t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN deals d ON t.deal_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ` AND t.status = ?`; params.push(status); }
    if (priority) { query += ` AND t.priority = ?`; params.push(priority); }
    if (contact_id) { query += ` AND t.contact_id = ?`; params.push(contact_id); }
    if (deal_id) { query += ` AND t.deal_id = ?`; params.push(deal_id); }
    query += ` ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, t.due_date ASC`;

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get single task
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, c.first_name || ' ' || c.last_name as contact_name, d.title as deal_title
      FROM tasks t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN deals d ON t.deal_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create task
router.post('/', (req, res) => {
  try {
    const { title, description, due_date, priority, status, contact_id, deal_id, assigned_to } = req.body;
    if (!title) return res.status(400).json({ error: 'Название обязательно' });

    const result = db.prepare(`
      INSERT INTO tasks (title, description, due_date, priority, status, contact_id, deal_id, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || null, due_date || null, priority || 'medium', status || 'pending', contact_id || null, deal_id || null, assigned_to || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Задача не найдена' });

    const { title, description, due_date, priority, status, contact_id, deal_id, assigned_to } = req.body;
    db.prepare(`
      UPDATE tasks SET title=?, description=?, due_date=?, priority=?, status=?, contact_id=?, deal_id=?, assigned_to=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      title || existing.title,
      description !== undefined ? description : existing.description,
      due_date !== undefined ? due_date : existing.due_date,
      priority || existing.priority,
      status || existing.status,
      contact_id !== undefined ? contact_id : existing.contact_id,
      deal_id !== undefined ? deal_id : existing.deal_id,
      assigned_to !== undefined ? assigned_to : existing.assigned_to,
      req.params.id
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Задача не найдена' });
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Задача удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
