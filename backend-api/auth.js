const jwt = require('jsonwebtoken');
const axios = require('axios');

const KEYCLOAK_CONFIG = {
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'oauth2-app'
};

let keycloakPublicKey = null;

async function getKeycloakPublicKey() {
  if (keycloakPublicKey) {
    return keycloakPublicKey;
  }

  try {
    const certsUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/certs`;
    console.log('Fetching Keycloak public key from:', certsUrl);
    const response = await axios.get(certsUrl);
    
    const key = response.data.keys.find(k => k.use === 'sig' && k.alg === 'RS256');
    if (key && key.x5c && key.x5c[0]) {
      keycloakPublicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
      console.log('Keycloak public key loaded');
      return keycloakPublicKey;
    } else {
      throw new Error('No x5c certificate found in JWK');
    }
  } catch (error) {
    console.error('Failed to fetch Keycloak public key:', error.message);
    throw error;
  }
}

async function introspectToken(token) {
  try {
    const introspectUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token/introspect`;
    
    const response = await axios.post(introspectUrl, 
      new URLSearchParams({
        token: token,
        client_id: process.env.KEYCLOAK_CLIENT_ID || 'resource-server'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token introspection failed:', error.message);
    return { active: false };
  }
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu' });
  }

  try {
    const publicKey = await getKeycloakPublicKey();
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      roles: decoded.realm_access?.roles || [],
      clientRoles: decoded.resource_access || {}
    };
    
    console.log('Token verified:', decoded.preferred_username, 'roles:', decoded.realm_access?.roles);
    return next();
    
  } catch (error) {
    console.error('Token verification error:', error.message);
    console.error('Token starts with:', token.substring(0, 50) + '...');
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ 
        error: 'Brak uprawnień',
        required: role,
        userRoles: req.user?.roles || []
      });
    }
    next();
  };
};

const debugToken = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  res.json({
    user: req.user,
    timestamp: new Date().toISOString(),
    keycloakConfig: {
      url: KEYCLOAK_CONFIG.url,
      realm: KEYCLOAK_CONFIG.realm
    }
  });
};

module.exports = { verifyToken, requireRole, debugToken }; 