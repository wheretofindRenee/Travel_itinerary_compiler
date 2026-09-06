const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'web')));

// 路由
app.use('/api', require('./routes/itinerary'));
app.use('/api', require('./routes/share'));
app.use('/api', require('./routes/destination'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动
initDB();
app.listen(PORT, () => {
  console.log(`\n  攻略编译器 已启动`);
  console.log(`  前端: http://localhost:${PORT}`);
  console.log(`  API : http://localhost:${PORT}/api/health`);
  console.log(`\n`);
});
