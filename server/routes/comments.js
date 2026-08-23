const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get comments for an entity
router.get('/', (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type и entity_id обязательны' });
    }

    const comments = db.prepare(`
      SELECT c.*, u.username as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.entity_type = ? AND c.entity_id = ?
      ORDER BY c.created_at DESC
    `).all(entity_type, entity_id);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create comment
router.post('/', (req, res) => {
  try {
    const { entity_type, entity_id, text } = req.body;
    if (!entity_type || !entity_id || !text) {
      return res.status(400).json({ error: 'entity_type, entity_id и text обязательны' });
    }

    const result = db.prepare(`
      INSERT INTO comments (entity_type, entity_id, user_id, text)
      VALUES (?, ?, ?, ?)
    `).run(entity_type, entity_id, req.user.id, text);

    const comment = db.prepare(`
      SELECT c.*, u.username as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete comment
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Комментарий не найден' });

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Комментарий удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
