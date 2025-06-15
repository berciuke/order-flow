import React, { useState, useEffect } from "react";
import Keycloak from "keycloak-js";

// Konfiguracja Keycloak - jak na zajęciach
const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.REACT_APP_KEYCLOAK_REALM || "oauth2-app",
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || "spa-client"
});

function App() {
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("home");

  useEffect(() => {
    // Inicjalizacja Keycloak - jak na zajęciach
    keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false  // Fix CSP frame-ancestors
    }).then(authenticated => {
      setAuth(authenticated);
      setLoading(false);
      
      if (authenticated) {
        setUser(keycloak.tokenParsed);
        console.log('Zalogowany:', keycloak.tokenParsed.preferred_username);
      }
    }).catch(error => {
      console.error('Keycloak error:', error);
      setLoading(false);
    });
  }, []);

  // Login - jak na zajęciach
  const login = () => {
    keycloak.login();
  };

  // Logout - jak na zajęciach  
  const logout = () => {
    keycloak.logout();
  };

  // Wywołanie API - jak na zajęciach
  const callAPI = async (endpoint) => {
    if (!auth) return;

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      
      const data = await response.json();
      
      if (endpoint === "/api/products") {
        setProducts(data);
      }
      
      console.log('API response:', data);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  // Loading screen - jak na zajęciach
  if (loading) {
    return (
      <div className="container">
        <h1>🔄 Ładowanie...</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 OAuth2 SPA Demo</h1>
        <p>Authorization Code + PKCE</p>
        
        {auth ? (
          <div>
            <p>Witaj <strong>{user?.preferred_username}</strong>!</p>
            <p>Role: {user?.realm_access?.roles?.join(', ') || 'brak'}</p>
            <button className="button" onClick={logout}>Wyloguj</button>
          </div>
        ) : (
          <button className="button" onClick={login}>Zaloguj przez Keycloak</button>
        )}
      </div>

      {auth && (
        <div>
          <div className="nav">
            <button className="button" onClick={() => setView("products")}>Produkty</button>
            <button className="button" onClick={() => setView("api")}>Test API</button>
          </div>

          {view === "products" && (
            <div className="card">
              <h2>📦 Produkty</h2>
              <button className="button" onClick={() => callAPI("/api/products")}>
                Pobierz produkty
              </button>
              {products.map(product => (
                <div key={product.id} className="card">
                  <h3>{product.name}</h3>
                  <p>Cena: {product.price} zł</p>
                </div>
              ))}
            </div>
          )}

          {view === "api" && (
            <div className="card">
              <h2>🌐 Test API</h2>
              <p><strong>Token:</strong> {keycloak.token?.substring(0, 50)}...</p>
              <p><strong>User:</strong> {user?.preferred_username}</p>
              <p><strong>Roles:</strong> {user?.realm_access?.roles?.join(", ")}</p>
              
              <div>
                <button className="button" onClick={() => callAPI("/api/protected")}>Test Protected</button>
                <button className="button" onClick={() => callAPI("/api/data")}>Test Data</button>
                <button className="button" onClick={() => callAPI("/api/admin")}>Test Admin</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!auth && (
        <div className="card">
          <h2>🔐 Wymagane logowanie</h2>
          <p>Zaloguj się przez Keycloak</p>
          <p><strong>Keycloak URL:</strong> {process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080"}</p>
        </div>
      )}
    </div>
  );
}

export default App;
