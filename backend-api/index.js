require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyToken, requireRole, debugToken } = require('./auth');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Resource Server' });
});

app.get('/api/data', verifyToken, (req, res) => {
  res.json({ 
    message: 'Dane chronione',
    user: req.user.username,
    roles: req.user.roles 
  });
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 }
  ]);
});

app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ 
    message: 'Protected endpoint', 
    user: req.user.username 
  });
});

app.get('/api/admin', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: 'Panel administratora' });
});

app.post('/api/orders', verifyToken, (req, res) => {
  console.log('New order from:', req.user.username); 
  res.json({ 
    message: 'Order created', 
    order: req.body,
    user: req.user.username 
  });
});

// Debug endpoint for token inspection
app.get('/api/debug/token', verifyToken, debugToken);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Resource Server na porcie ${PORT}`); 
}); 