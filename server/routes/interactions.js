const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all interactions
router.get('/', (req, res) => {
  try {
    const { contact_id, deal_id, type } = req.query;
    let query = `
      SELECT i.*, c.first_name || ' ' || c.last_name as contact_name, d.title as deal_title, u.username
      FROM interactions i
      LEFT JOIN contacts c ON i.contact_id = c.id
      LEFT JOIN deals d ON i.deal_id = d.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (contact_id) { query += ` AND i.contact_id = ?`; params.push(contact_id); }
    if (deal_id) { query += ` AND i.deal_id = ?`; params.push(deal_id); }
    if (type) { query += ` AND i.type = ?`; params.push(type); }
    query += ` ORDER BY i.date DESC`;

    const interactions = db.prepare(query).all(...params);
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get single interaction
router.get('/:id', (req, res) => {
  try {
    const interaction = db.prepare(`
      SELECT i.*, c.first_name || ' ' || c.last_name as contact_name, d.title as deal_title, u.username
      FROM interactions i
      LEFT JOIN contacts c ON i.contact_id = c.id
      LEFT JOIN deals d ON i.deal_id = d.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `).get(req.params.id);
    if (!interaction) return res.status(404).json({ error: 'Взаимодействие не найдено' });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create interaction
router.post('/', (req, res) => {
  try {
    const { type, subject, description, contact_id, deal_id, date } = req.body;
    if (!type || !subject) return res.status(400).json({ error: 'Тип и тема обязательны' });

    const result = db.prepare(`
      INSERT INTO interactions (type, subject, description, contact_id, deal_id, user_id, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, subject, description || null, contact_id || null, deal_id || null, req.user.id, date || new Date().toISOString());

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(interaction);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update interaction
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Взаимодействие не найдено' });

    const { type, subject, description, contact_id, deal_id, date } = req.body;
    db.prepare(`
      UPDATE interactions SET type=?, subject=?, description=?, contact_id=?, deal_id=?, date=?
      WHERE id=?
    `).run(
      type || existing.type,
      subject || existing.subject,
      description !== undefined ? description : existing.description,
      contact_id !== undefined ? contact_id : existing.contact_id,
      deal_id !== undefined ? deal_id : existing.deal_id,
      date || existing.date,
      req.params.id
    );

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete interaction
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Взаимодействие не найдено' });
    db.prepare('DELETE FROM interactions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Взаимодействие удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
