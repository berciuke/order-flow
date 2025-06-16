const express = require('express');
const cors = require('cors');
const { verifyToken, debugToken } = require('./auth');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'FitTrack Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/auth/debug', verifyToken, debugToken);

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`FitTrack Backend API listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Debug token: http://localhost:${PORT}/auth/debug`);
}); 