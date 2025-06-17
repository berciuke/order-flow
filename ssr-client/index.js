require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "crypto-strong-session-secret-a8b9c0d1e2f3456789abcdef01234567890abcdef",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const KEYCLOAK_CONFIG = {
  url: process.env.KEYCLOAK_URL,
  publicUrl: process.env.KEYCLOAK_PUBLIC_URL || process.env.KEYCLOAK_URL,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
};

console.log("SSR Client Config:", {
  ...KEYCLOAK_CONFIG,
  clientSecret: "***hidden***",
});

function buildAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: KEYCLOAK_CONFIG.redirectUri,
    state: state,
    scope: "openid profile email",
  });

  return `${KEYCLOAK_CONFIG.publicUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params}`;
}

function buildTokenUrl() {
  return `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
}

function buildLogoutUrl() {
  return `${KEYCLOAK_CONFIG.publicUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CONFIG.clientId,
    client_secret: KEYCLOAK_CONFIG.clientSecret,
    code: code,
    redirect_uri: KEYCLOAK_CONFIG.redirectUri,
  });

  try {
    const response = await axios.post(buildTokenUrl(), params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function callResourceAPI(endpoint, token, method = "GET", data = null) {
  try {
    const config = {
      method,
      url: `${process.env.RESOURCE_API}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `Resource API Error (${method} ${endpoint}):`,
      error.response?.data || error.message
    );
    throw error;
  }
}

app.get("/", (req, res) => {
  const user = req.session.user;

  if (user) {
    const roles = user.realm_access?.roles || [];
    const isAdmin = roles.includes("admin");

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OrderFlow SSR - OAuth2 Demo</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            .header { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
            .user-info { background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
            .admin-panel { background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
            .api-section { background: #e8f4fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
            button { padding: 0.5rem 1rem; margin: 0.5rem; cursor: pointer; border: none; border-radius: 4px; }
            .btn-primary { background: #007bff; color: white; }
            .btn-danger { background: #dc3545; color: white; }
            .btn-secondary { background: #6c757d; color: white; }
            pre { background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FitTrack Coach Portal</h1>
            <p><strong>Authorization Code Flow</strong> - Portal dla trenerów i sportowców</p>
          </div>
          
          <div class="user-info">
            <h2>Witaj ${user.preferred_username}!</h2>
            <p><strong>Email:</strong> ${user.email || "N/A"}</p>
            <p><strong>Role:</strong> ${roles.join(", ") || "none"}</p>
            <p><strong>Sub:</strong> ${user.sub}</p>
          </div>
          
          ${
            roles.includes("coach")
              ? `
            <div class="admin-panel">
              <h3>Panel Trenera</h3>
              <p>Masz uprawnienia trenera personalnego!</p>
              <button class="btn-primary" onclick="testAPI('/api/coach-panel')">Moi Podopieczni</button>
            </div>
          `
              : ""
          }
          
          ${
            isAdmin
              ? `
            <div class="admin-panel">
              <h3>Panel Administratora FitTrack</h3>
              <p>Zarządzanie platformą fitness!</p>
              <button class="btn-primary" onclick="window.location.href='/admin'">Admin Dashboard</button>
            </div>
          `
              : ""
          }
          
          <div class="api-section">
            <h3>Test Fitness API</h3>
            <button class="btn-primary" onclick="testAPI('/health')">Test Health</button>
            <button class="btn-primary" onclick="testAPI('/api/exercises')">Baza Ćwiczeń</button>
            <button class="btn-primary" onclick="testAPI('/api/workouts')">Moje Treningi</button>
            <button class="btn-primary" onclick="testAPI('/api/protected')">Test Protected</button>
            <div id="apiResult"></div>
          </div>
          
          <div>
            <h3>Debug Info</h3>
            <button class="btn-secondary" onclick="toggleDebug()">Toggle Token Info</button>
            <div id="debugInfo" style="display: none;">
              <pre>${JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
          
          <div style="margin-top: 2rem;">
            <button class="btn-danger" onclick="window.location.href='/logout'">Wyloguj</button>
          </div>
          
          <script>
            function toggleDebug() {
              const debug = document.getElementById('debugInfo');
              debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
            }
            
            async function testAPI(endpoint) {
              const result = document.getElementById('apiResult');
              result.innerHTML = '<p>Testing...</p>';
              
              try {
                const response = await fetch('/api-test' + endpoint);
                const data = await response.json();
                result.innerHTML = '<h4>API Result:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
              } catch (error) {
                result.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
              }
            }
          </script>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OrderFlow SSR - Login</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center; }
            .login-container { background: #f8f9fa; padding: 3rem; border-radius: 12px; margin: 2rem 0; }
            button { padding: 1rem 2rem; font-size: 1.1rem; cursor: pointer; border: none; border-radius: 6px; }
            .btn-primary { background: #007bff; color: white; }
            .info { background: #e8f4fd; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <h1>OrderFlow SSR Demo</h1>
          <div class="info">
            <p><strong>Server-Side Rendered OAuth2 Client</strong></p>
            <p>Authorization Code Flow with Keycloak</p>
          </div>
          
          <div class="login-container">
            <h2>Wymagane Logowanie</h2>
            <p>Aby korzystać z aplikacji, zaloguj się przez Keycloak</p>
            <button class="btn-primary" onclick="window.location.href='/login'">
              Zaloguj przez OAuth2
            </button>
          </div>
        </body>
      </html>
    `);
  }
});

app.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauth_state = state;

  const authUrl = buildAuthUrl(state);
  console.log("Redirecting to Keycloak:", authUrl);

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error("OAuth error:", error);
    return res.send(
      `<h1>OAuth Error</h1><p>${error}</p><a href="/">Powrót</a>`
    );
  }

  if (state !== req.session.oauth_state) {
    console.error("State mismatch:", {
      received: state,
      expected: req.session.oauth_state,
    });
    return res.send(
      '<h1>Security Error</h1><p>Invalid state parameter</p><a href="/">Powrót</a>'
    );
  }

  if (!code) {
    return res.send(
      '<h1>Error</h1><p>No authorization code received</p><a href="/">Powrót</a>'
    );
  }

  try {
    console.log("Exchanging code for token...");
    const tokenData = await exchangeCodeForToken(code);

    const user = jwt.decode(tokenData.id_token);

    req.session.user = user;
    req.session.tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      id_token: tokenData.id_token,
    };

    delete req.session.oauth_state;

    console.log("User authenticated:", user.preferred_username);

    res.redirect("/");
  } catch (error) {
    console.error("Token exchange failed:", error);
    res.send(
      `<h1>Authentication Failed</h1><p>${error.message}</p><a href="/">Powrót</a>`
    );
  }
});

app.get("/logout", (req, res) => {
  const user = req.session.user;
  const tokens = req.session.tokens;
  
  const logoutParams = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    post_logout_redirect_uri: "http://localhost:3002"
  });
  
  if (tokens?.id_token) {
    logoutParams.set('id_token_hint', tokens.id_token);
  }

  const logoutUrl = buildLogoutUrl() + "?" + logoutParams.toString();
  
  console.log("Logging out user:", user?.preferred_username);
  console.log("Logout URL:", logoutUrl);

  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
    }
    console.log("Session destroyed, redirecting to Keycloak logout");
    res.redirect(logoutUrl);
  });
});

app.get("/admin", (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.redirect("/login");
  }

  const roles = user.realm_access?.roles || [];
  if (!roles.includes("admin")) {
    return res.send(
      '<h1>Access Denied</h1><p>Admin role required</p><a href="/">Powrót</a>'
    );
  }

  res.send(`
    <h1>Admin Dashboard</h1>
    <p>Witaj w panelu administratora, ${user.preferred_username}!</p>
    <p>Role: ${roles.join(", ")}</p>
    <a href="/">← Powrót</a>
  `);
});

app.get("/api-test/*", async (req, res) => {
  const user = req.session.user;
  const tokens = req.session.tokens;

  if (!user || !tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const endpoint = req.path.replace("/api-test", "");

  try {
    const result = await callResourceAPI(endpoint, tokens.access_token);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      endpoint: endpoint,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ssr-client",
    oauth2: "ready",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`SSR Client running on http://localhost:${PORT}`);
  console.log("OAuth2 Authorization Code Flow ready");
  console.log("Keycloak URL:", KEYCLOAK_CONFIG.url);
});
