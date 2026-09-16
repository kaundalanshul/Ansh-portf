const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamic config endpoint — injects API_BASE
// On Render: auto-detects Render or uses API_URL env var -> https://ansh-portf-2cf4.onrender.com/api
// Locally: defaults to http://localhost:5000/api
app.get('/config.js', (req, res) => {
  const host = req.get('host') || '';
  const isRender = process.env.RENDER === 'true' || host.includes('onrender.com');
  const defaultApi = isRender
    ? 'https://ansh-portf-2cf4.onrender.com/api'
    : 'http://localhost:5000/api';
  const apiUrl = process.env.API_URL || defaultApi;
  res.type('application/javascript');
  res.send(`window.API_BASE = "${apiUrl}";`);
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🔐 Admin Dashboard running on http://localhost:${PORT}\n`);
});
