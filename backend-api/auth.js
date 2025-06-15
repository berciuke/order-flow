const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu' });
  }
  
  const decoded = jwt.decode(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
  
  req.user = {
    id: decoded.sub,
    username: decoded.preferred_username,
    email: decoded.email,
    roles: decoded.realm_access?.roles || []
  };
  
  console.log('Token decoded:', decoded.preferred_username); 
  next();
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole }; 