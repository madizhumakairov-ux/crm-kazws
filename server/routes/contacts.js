const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all contacts
router.get('/', (req, res) => {
  try {
    const { search, company_id, tag } = req.query;
    let query = `
      SELECT c.*, co.name as company_name,
        (SELECT COUNT(*) FROM interactions WHERE contact_id = c.id) as interaction_count
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (company_id) {
      query += ` AND c.company_id = ?`;
      params.push(company_id);
    }
    if (tag) {
      query += ` AND c.tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    query += ` ORDER BY c.created_at DESC`;
    const contacts = db.prepare(query).all(...params);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get single contact
router.get('/:id', (req, res) => {
  try {
    const contact = db.prepare(`
      SELECT c.*, co.name as company_name
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Контакт не найден' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create contact
router.post('/', (req, res) => {
  try {
    const { first_name, last_name, email, phone, position, company_id, tags, notes } = req.body;
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Имя и фамилия обязательны' });
    }
    const result = db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, phone, position, company_id, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(first_name, last_name, email || null, phone || null, position || null, company_id || null, JSON.stringify(tags || []), notes || null);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update contact
router.put('/:id', (req, res) => {
  try {
    const { first_name, last_name, email, phone, position, company_id, tags, notes } = req.body;
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Контакт не найден' });

    db.prepare(`
      UPDATE contacts SET first_name=?, last_name=?, email=?, phone=?, position=?, company_id=?, tags=?, notes=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      first_name || existing.first_name,
      last_name || existing.last_name,
      email !== undefined ? email : existing.email,
      phone !== undefined ? phone : existing.phone,
      position !== undefined ? position : existing.position,
      company_id !== undefined ? company_id : existing.company_id,
      tags ? JSON.stringify(tags) : existing.tags,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete contact
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Контакт не найден' });
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Контакт удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
