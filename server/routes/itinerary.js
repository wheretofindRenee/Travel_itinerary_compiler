const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { compileItinerary } = require('../compiler');

const DATA_DIR = path.join(__dirname, '..', 'data');

router.post('/itinerary/generate', (req, res) => {
  try {
    const input = req.body;
    const destName = input.destination || 'seoul';
    const file = path.join(DATA_DIR, `${destName}.json`);
    
    if (!fs.existsSync(file)) {
      return res.status(404).json({ error: `Destination "${destName}" not found` });
    }

    const destinationData = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const result = compileItinerary(destinationData, input);
    res.json(result);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
