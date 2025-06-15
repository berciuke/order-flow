const jwt = require('jsonwebtoken');
const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'oauth2-app'
};

// Cache for Keycloak public key
let keycloakPublicKey = null;

// Get Keycloak public key for JWT verification
async function getKeycloakPublicKey() {
  if (keycloakPublicKey) {
    return keycloakPublicKey;
  }

  try {
    const certsUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/certs`;
    const response = await axios.get(certsUrl);
    
    // Get first key (usually there's only one)
    const key = response.data.keys[0];
    if (key) {
      // Convert JWK to PEM format
      keycloakPublicKey = `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;
      console.log('✅ Keycloak public key loaded');
      return keycloakPublicKey;
    }
  } catch (error) {
    console.error('❌ Failed to fetch Keycloak public key:', error.message);
    throw error;
  }
}

// Introspect token with Keycloak
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
    console.error('❌ Token introspection failed:', error.message);
    return { active: false };
  }
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu' });
  }

  try {
    // Method 1: Try to verify with public key (faster)
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
      
      console.log('✅ Token verified with public key:', decoded.preferred_username);
      return next();
      
    } catch (jwtError) {
      console.log('⚠️ Public key verification failed, trying introspection...');
      
      // Method 2: Fallback to introspection (slower but more reliable)
      const introspection = await introspectToken(token);
      
      if (!introspection.active) {
        return res.status(401).json({ error: 'Token nieaktywny' });
      }

      // Decode token for user info (don't verify signature, we trust introspection)
      const decoded = jwt.decode(token);
      
      req.user = {
        id: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
        clientRoles: decoded.resource_access || {}
      };
      
      console.log('✅ Token verified with introspection:', decoded.preferred_username);
      return next();
    }

  } catch (error) {
    console.error('❌ Token verification error:', error.message);
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

// Debug endpoint for token info
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