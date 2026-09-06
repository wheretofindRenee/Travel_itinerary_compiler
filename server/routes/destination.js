const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

router.get('/destinations', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const destinations = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      return {
        id: data.id,
        name: data.name,
        country: data.country,
        tagline: data.tagline,
        image: data.image
      };
    });
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/destinations/:name', (req, res) => {
  try {
    const file = path.join(DATA_DIR, `${req.params.name}.json`);
    if (!fs.existsSync(file)) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
