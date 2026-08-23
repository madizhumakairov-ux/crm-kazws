const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Get all stages
router.get('/', (req, res) => {
  try {
    const stages = db.prepare('SELECT * FROM pipeline_stages ORDER BY position ASC').all();
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create stage
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });

    const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM pipeline_stages').get();
    const position = (maxPos.maxPos || 0) + 1;

    const result = db.prepare(`
      INSERT INTO pipeline_stages (name, color, position)
      VALUES (?, ?, ?)
    `).run(name, color || '#3B82F6', position);

    const stage = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(stage);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update stage
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Этап не найден' });

    const { name, color } = req.body;
    db.prepare(`
      UPDATE pipeline_stages SET name=?, color=? WHERE id=?
    `).run(name || existing.name, color || existing.color, req.params.id);

    const stage = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json(stage);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Reorder stages
router.put('/reorder', (req, res) => {
  try {
    const { stageIds } = req.body;
    if (!Array.isArray(stageIds)) {
      return res.status(400).json({ error: 'stageIds должен быть массивом' });
    }

    const updateStmt = db.prepare('UPDATE pipeline_stages SET position = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });
    transaction(stageIds);

    const stages = db.prepare('SELECT * FROM pipeline_stages ORDER BY position ASC').all();
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete stage
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Этап не найден' });

    const { move_to } = req.query;
    if (move_to) {
      db.prepare('UPDATE deals SET stage = ? WHERE stage = ?').run(move_to, existing.name.toLowerCase().replace(/\s+/g, '_'));
    }

    db.prepare('DELETE FROM pipeline_stages WHERE id = ?').run(req.params.id);
    res.json({ message: 'Этап удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
