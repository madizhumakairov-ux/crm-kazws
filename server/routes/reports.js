const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

// Dashboard KPIs
router.get('/dashboard', (req, res) => {
  try {
    const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    const activeDeals = db.prepare("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('won', 'lost')").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage = 'won'").get().total;
    const tasksDue = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'done' AND due_date <= date('now', '+7 days')").get().count;

    // Pipeline summary
    const pipeline = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value
      FROM deals GROUP BY stage
    `).all();

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT 'interaction' as type, i.subject as title, i.date, u.username
      FROM interactions i LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.date DESC LIMIT 10
    `).all();

    res.json({ totalContacts, activeDeals, totalRevenue, tasksDue, pipeline, recentActivity });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Revenue by month
router.get('/revenue', (req, res) => {
  try {
    const revenue = db.prepare(`
      SELECT strftime('%Y-%m', closed_at) as month, SUM(value) as total
      FROM deals WHERE stage = 'won' AND closed_at IS NOT NULL
      GROUP BY strftime('%Y-%m', closed_at)
      ORDER BY month ASC
    `).all();
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Deals by stage
router.get('/deals-by-stage', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value
      FROM deals GROUP BY stage
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Top contacts by deal value
router.get('/top-contacts', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT c.id, c.first_name || ' ' || c.last_name as name, c.email,
        COUNT(d.id) as deal_count, COALESCE(SUM(d.value), 0) as total_value
      FROM contacts c
      LEFT JOIN deals d ON d.contact_id = c.id
      GROUP BY c.id
      ORDER BY total_value DESC
      LIMIT 10
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Conversion rate
router.get('/conversion', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM deals').get().count;
    const won = db.prepare("SELECT COUNT(*) as count FROM deals WHERE stage = 'won'").get().count;
    const lost = db.prepare("SELECT COUNT(*) as count FROM deals WHERE stage = 'lost'").get().count;
    const rate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
    res.json({ total, won, lost, rate: parseFloat(rate) });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
