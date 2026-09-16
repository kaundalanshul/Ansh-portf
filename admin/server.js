const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamic config endpoint — injects API_BASE from environment variable
// On Render: set API_URL=https://ansh-portf-2cf4.onrender.com/api
// Locally: defaults to http://localhost:5000/api
app.get('/config.js', (req, res) => {
  const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
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
