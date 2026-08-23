const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all companies
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT co.*,
        (SELECT COUNT(*) FROM contacts WHERE company_id = co.id) as contact_count,
        (SELECT COUNT(*) FROM deals WHERE company_id = co.id) as deal_count
      FROM companies co WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ` AND (co.name LIKE ? OR co.industry LIKE ? OR co.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ` ORDER BY co.created_at DESC`;
    const companies = db.prepare(query).all(...params);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get single company
router.get('/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) return res.status(404).json({ error: 'Компания не найдена' });

    const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ?').all(req.params.id);
    const deals = db.prepare('SELECT * FROM deals WHERE company_id = ?').all(req.params.id);
    res.json({ ...company, contacts, deals });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create company
router.post('/', (req, res) => {
  try {
    const { name, industry, website, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });

    const result = db.prepare(`
      INSERT INTO companies (name, industry, website, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, industry || null, website || null, phone || null, email || null, address || null, notes || null);

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update company
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Компания не найдена' });

    const { name, industry, website, phone, email, address, notes } = req.body;
    db.prepare(`
      UPDATE companies SET name=?, industry=?, website=?, phone=?, email=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      name || existing.name,
      industry !== undefined ? industry : existing.industry,
      website !== undefined ? website : existing.website,
      phone !== undefined ? phone : existing.phone,
      email !== undefined ? email : existing.email,
      address !== undefined ? address : existing.address,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete company
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Компания не найдена' });
    db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
    res.json({ message: 'Компания удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
