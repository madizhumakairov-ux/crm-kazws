const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all deals
router.get('/', (req, res) => {
  try {
    const { stage, contact_id, company_id } = req.query;
    let query = `
      SELECT d.*, c.first_name || ' ' || c.last_name as contact_name, co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE 1=1
    `;
    const params = [];
    if (stage) { query += ` AND d.stage = ?`; params.push(stage); }
    if (contact_id) { query += ` AND d.contact_id = ?`; params.push(contact_id); }
    if (company_id) { query += ` AND d.company_id = ?`; params.push(company_id); }
    query += ` ORDER BY d.created_at DESC`;

    const deals = db.prepare(query).all(...params);
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get single deal
router.get('/:id', (req, res) => {
  try {
    const deal = db.prepare(`
      SELECT d.*, c.first_name || ' ' || c.last_name as contact_name, co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Сделка не найдена' });
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create deal
router.post('/', (req, res) => {
  try {
    const { title, value, stage, contact_id, company_id, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Название обязательно' });

    const result = db.prepare(`
      INSERT INTO deals (title, value, stage, contact_id, company_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, value || 0, stage || 'new', contact_id || null, company_id || null, notes || null);

    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update deal (including stage change for Kanban)
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Сделка не найдена' });

    const { title, value, stage, contact_id, company_id, notes } = req.body;
    const closed_at = (stage === 'won' || stage === 'lost') && existing.stage !== stage ? new Date().toISOString() : existing.closed_at;

    db.prepare(`
      UPDATE deals SET title=?, value=?, stage=?, contact_id=?, company_id=?, notes=?, updated_at=CURRENT_TIMESTAMP, closed_at=?
      WHERE id=?
    `).run(
      title || existing.title,
      value !== undefined ? value : existing.value,
      stage || existing.stage,
      contact_id !== undefined ? contact_id : existing.contact_id,
      company_id !== undefined ? company_id : existing.company_id,
      notes !== undefined ? notes : existing.notes,
      closed_at,
      req.params.id
    );

    const deal = db.prepare(`
      SELECT d.*, c.first_name || ' ' || c.last_name as contact_name, co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE d.id = ?
    `).get(req.params.id);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete deal
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Сделка не найдена' });
    db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
    res.json({ message: 'Сделка удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
