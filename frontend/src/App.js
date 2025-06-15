import React, { useState } from "react";

// tymczasowo mockuję oauth2
const mockAuth = {
  authenticated: false,
  user: null,
  token: null,
};

function App() {
  const [auth, setAuth] = useState(mockAuth);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("home");

  // tymczasowo mockuję login
  const login = () => {
    console.log("Mock login...");
    setAuth({
      authenticated: true,
      user: { username: "testuser", roles: ["user"] },
      token: "mock-jwt-token-123",
    });
  };

  // tymczasowo mockuję logout
  const logout = () => {
    console.log("Mock logout...");
    setAuth(mockAuth);
    setView("home");
  };

  // tymczasowo mockuję API call
  const callAPI = async (endpoint) => {
    console.log(`Mock API call: ${endpoint}`);

    if (endpoint === "/api/products") {
      setProducts([
        { id: 1, name: "Laptop", price: 2999, stock: 5 },
        { id: 2, name: "Mysz", price: 99, stock: 10 },
        { id: 3, name: "Klawiatura", price: 299, stock: 3 },
      ]);
    }
    if (endpoint === "/api/orders") {
      setOrders([
        { id: 1, status: "PENDING", total: 2999, date: "2024-01-15" },
        { id: 2, status: "SHIPPED", total: 398, date: "2024-01-10" },
      ]);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>SPA OAuth2 Demo</h1>
        {auth.authenticated ? (
          <div>
            Witaj {auth.user.username}!
            <button
              className="button"
              style={{ marginLeft: "10px" }}
              onClick={logout}
            >
              Wyloguj
            </button>
          </div>
        ) : (
          <button className="button" onClick={login}>
            Zaloguj (Mock)
          </button>
        )}
      </div>

      {auth.authenticated ? (
        <>
          <div className="nav">
            <button className="button" onClick={() => setView("products")}>
              Produkty
            </button>
            <button className="button" onClick={() => setView("orders")}>
              Zamówienia
            </button>
            <button className="button" onClick={() => setView("api")}>
              Test API
            </button>
          </div>

          {view === "products" && (
            <div>
              <h2>Produkty</h2>
              <button
                className="button"
                onClick={() => callAPI("/api/products")}
              >
                Pobierz produkty
              </button>
              {products.map((product) => (
                <div key={product.id} className="card">
                  <h3>{product.name}</h3>
                  <p>
                    Cena: {product.price} zł | Dostępne: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          )}

          {view === "orders" && (
            <div>
              <h2>Zamówienia</h2>
              <button className="button" onClick={() => callAPI("/api/orders")}>
                Pobierz zamówienia
              </button>
              {orders.map((order) => (
                <div key={order.id} className="card">
                  <h3>Zamówienie #{order.id}</h3>
                  <p>
                    Status: {order.status} | Suma: {order.total} zł
                  </p>
                  <p>Data: {order.date}</p>
                </div>
              ))}
            </div>
          )}

          {view === "api" && (
            <div className="card">
              <h2>Test API</h2>
              <p>
                <strong>Token:</strong> {auth.token}
              </p>
              <p>
                <strong>User:</strong> {auth.user.username}
              </p>
              <p>
                <strong>Roles:</strong> {auth.user.roles.join(", ")}
              </p>
              <button
                className="button"
                onClick={() => callAPI("/api/protected")}
              >
                Wywołaj chroniony endpoint
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <h2>Wymagane logowanie</h2>
          <p>Zaloguj się aby korzystać z aplikacji</p>
          <p>
            <em>(Mock OAuth2 - kliknij "Zaloguj" powyżej)</em>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
