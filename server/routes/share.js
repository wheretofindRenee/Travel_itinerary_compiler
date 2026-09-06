const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(4).toString('hex');
}

router.post('/share', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'data is required' });

    const db = getDB();
    const token = generateToken();
    const stmt = db.prepare('INSERT INTO itineraries (token, data) VALUES (?, ?)');
    stmt.run(token, JSON.stringify(data));
    
    res.json({ token, url: `/share/${token}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/share/:token', (req, res) => {
  try {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM itineraries WHERE token = ?');
    const row = stmt.get(req.params.token);
    
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(row.data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
