import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Stała z adresem bazowym API, aby łatwo ją zmieniać
const API_BASE_URL = 'http://localhost:8000/'; // Zakładam, że backend działa na porcie 8000

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrderItems, setCurrentOrderItems] = useState([]); // { productId, quantity, name, price }
  const [jsonResponse, setJsonResponse] = useState(null);
  const [view, setView] = useState('products'); // 'products', 'orders', 'login', 'register'
  const [error, setError] = useState('');

  const handleApiResponse = (data) => {
    setJsonResponse(JSON.stringify(data, null, 2));
  };

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      handleApiResponse(data);
      if (res.ok) {
        setCurrentUser(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać profilu użytkownika.');
      }
    } catch (err) {
      setError(`Błąd profilu: ${err.message}`);
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      setView('login');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      handleApiResponse(data);
      if (res.ok) {
        setProducts(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać produktów.');
      }
    } catch (err) {
      setError(`Błąd produktów: ${err.message}`);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      handleApiResponse(data);
      if (res.ok) {
        setOrders(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać zamówień.');
      }
    } catch (err) {
      setError(`Błąd zamówień: ${err.message}`);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      handleApiResponse(data);
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser({ id: data.userId, isAdmin: data.isAdmin }); // Tymczasowe, pełny profil pobierze useEffect
        setView('products');
        setError('');
      } else {
        throw new Error(data.message || 'Błąd logowania.');
      }
    } catch (err) {
      setError(`Logowanie: ${err.message}`);
      alert(`Błąd logowania: ${err.message}`);
    }
  };

  const handleRegister = async (email, password, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      handleApiResponse(data);
      if (res.status === 201) {
        alert('Rejestracja pomyślna! Możesz się teraz zalogować.');
        setView('login');
        setError('');
      } else {
        throw new Error(data.message || 'Błąd rejestracji.');
      }
    } catch (err) {
      setError(`Rejestracja: ${err.message}`);
      alert(`Błąd rejestracji: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setOrders([]);
    setCurrentOrderItems([]);
    setView('login');
    setJsonResponse(null);
    setError('');
  };

  const addProductToOrder = (product) => {
    setCurrentOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { productId: product.id, quantity: 1, name: product.name, price: product.price }];
      }
    });
    alert(`${product.name} dodano do zamówienia.`);
  };

  const updateOrderItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCurrentOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
    } else {
      setCurrentOrderItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!token || currentOrderItems.length === 0) {
      alert('Musisz być zalogowany i mieć produkty w koszyku, aby złożyć zamówienie.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: currentOrderItems.map(item => ({ productId: item.productId, quantity: item.quantity })) }),
      });
      const data = await res.json();
      handleApiResponse(data);
      if (res.status === 201) {
        alert('Zamówienie złożone pomyślnie!');
        setCurrentOrderItems([]);
        fetchOrders(); // Odśwież listę zamówień
        setView('orders');
      } else {
        throw new Error(data.message || 'Nie udało się złożyć zamówienia.');
      }
    } catch (err) {
      setError(`Składanie zamówienia: ${err.message}`);
      alert(`Błąd składania zamówienia: ${err.message}`);
    }
  };

  const deleteProduct = async (productId) => {
    if (!token || !currentUser?.isAdmin) {
        alert('Brak uprawnień.');
        return;
    }
    if (!window.confirm('Czy na pewno chcesz usunąć ten produkt?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        // Brak body w odpowiedzi 204
        handleApiResponse({ status: res.status, statusText: res.statusText });
        if (res.ok) {
            alert('Produkt usunięty.');
            fetchProducts(); // Odśwież listę
        } else {
            const data = await res.json().catch(() => ({ message: 'Błąd serwera przy usuwaniu produktu.'}));
            throw new Error(data.message || 'Nie udało się usunąć produktu.');
        }
    } catch (err) {
        setError(`Usuwanie produktu: ${err.message}`);
        alert(`Błąd usuwania produktu: ${err.message}`);
    }
  };
  
  // TODO: Funkcja edycji produktu (otwarcie modala/formularza)
  const editProduct = (product) => {
    alert(`Funkcjonalność edycji produktu (ID: ${product.id}) nie jest jeszcze zaimplementowana.`);
    // Tutaj logika otwarcia formularza edycji, np. ustawienie stanu dla modala
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>OrderFlow</h1>
        <nav>
          {token && <button onClick={() => setView('products')}>Produkty</button>}
          {token && <button onClick={() => { setView('orders'); fetchOrders(); }}>Moje Zamówienia</button>}
          {token && (
            <div className="user-info">
              <span>Zalogowano jako: {currentUser?.email} {currentUser?.isAdmin && '(Admin)'}</span>
              <button onClick={handleLogout}>Wyloguj</button>
            </div>
          )}
          {!token && <button onClick={() => setView('login')}>Logowanie</button>}
          {!token && <button onClick={() => setView('register')}>Rejestracja</button>}
        </nav>
      </header>

      {error && <div className="error-message">{error} <button onClick={() => setError('')}>X</button></div>}

      <main className="main-content">
        {view === 'login' && <AuthForm type="login" onSubmit={handleLogin} />}
        {view === 'register' && <AuthForm type="register" onSubmit={handleRegister} />}

        {token && view === 'products' && (
          <ProductsView 
            products={products} 
            onAddToCart={addProductToOrder} 
            currentUser={currentUser}
            onDeleteProduct={deleteProduct}
            onEditProduct={editProduct}
          />
        )}

        {token && (view === 'orders' || view === 'products' ) && currentOrderItems.length > 0 && (
          <CurrentOrderView 
            items={currentOrderItems} 
            onUpdateQuantity={updateOrderItemQuantity}
            onPlaceOrder={handlePlaceOrder}
            isOrderView={view === 'orders'} // Przekaż informację, czy to główny widok zamówień
          />
        )}

        {token && view === 'orders' && <OrdersListView orders={orders} />}
      </main>

      {jsonResponse && (
        <aside className="json-viewer-aside">
          <h3>Ostatnia odpowiedź API:</h3>
          <pre>{jsonResponse}</pre>
          <button onClick={() => setJsonResponse(null)}>Ukryj JSON</button>
        </aside>
      )}

      <footer className="app-footer">
        <p>&copy; 2024 OrderFlow App</p>
      </footer>
    </div>
  );
}

// Komponent formularza autentykacji
function AuthForm({ type, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Tylko dla rejestracji

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register') {
      onSubmit(email, password, name);
    } else {
      onSubmit(email, password);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{type === 'login' ? 'Logowanie' : 'Rejestracja'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {type === 'register' && (
          <div className="form-group">
            <label htmlFor="name">Imię i Nazwisko (opcjonalnie):</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <button type="submit" className="submit-button">{type === 'login' ? 'Zaloguj' : 'Zarejestruj'}</button>
      </form>
    </div>
  );
}

// Komponent widoku produktów
function ProductsView({ products, onAddToCart, currentUser, onDeleteProduct, onEditProduct }) {
  if (!products || products.length === 0) {
    return <p>Brak produktów do wyświetlenia.</p>;
  }
  return (
    <div className="products-view">
      <h2>Produkty</h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-tile" onClick={() => onAddToCart(product)}>
            <div className="product-initial">{product.name?.charAt(0).toUpperCase() || 'P'}</div>
            <div className="product-info">
                <h3>{product.name}</h3>
                <p>Cena: {product.price?.toFixed(2)} PLN</p>
                <p>Na stanie: {product.stock}</p>
            </div>
            {currentUser?.isAdmin && (
                <div className="admin-actions">
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEditProduct(product); }}>Edytuj</button>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }}>Usuń</button>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Komponent widoku aktualnego zamówienia (koszyka)
function CurrentOrderView({ items, onUpdateQuantity, onPlaceOrder, isOrderView }) {
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
    return (
      <div className={`current-order-view ${isOrderView ? 'full-width-order' : ''}`}>
        <h2>Twoje Aktualne Zamówienie</h2>
        {items.length === 0 ? (
          <p>Koszyk jest pusty.</p>
        ) : (
          <>
            <ul className="current-order-list">
              {items.map(item => (
                <li key={item.productId} className="current-order-item">
                  <span>{item.name} ({item.price?.toFixed(2)} PLN/szt.)</span>
                  <div className="quantity-controls">
                    <button onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span>Ilość: {item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}>+</button>
                    <button className="remove-item-btn" onClick={() => onUpdateQuantity(item.productId, 0)}>Usuń</button>
                  </div>
                  <span>Suma: {(item.price * item.quantity).toFixed(2)} PLN</span>
                </li>
              ))}
            </ul>
            <div className="current-order-summary">
                <p>Łączna kwota: <strong>{totalPrice.toFixed(2)} PLN</strong></p>
                <button onClick={onPlaceOrder} className="place-order-button">Złóż zamówienie</button>
            </div>
          </>
        )}
      </div>
    );
  }

// Komponent listy zamówień użytkownika
function OrdersListView({ orders }) {
    if (!orders || orders.length === 0) {
      return <p>Nie masz jeszcze żadnych zamówień.</p>;
    }
  
    return (
      <div className="orders-list-view">
        <h2>Twoje Zamówienia</h2>
        {orders.map(order => (
          <div key={order.id} className="order-summary-card">
            <h3>Zamówienie #{order.id.substring(0, 8)}...</h3>
            <p>Data: {new Date(order.createdAt).toLocaleDateString('pl-PL')} {new Date(order.createdAt).toLocaleTimeString('pl-PL')}</p>
            <p>Status: <span className={`status-${order.status?.toLowerCase()}`}>{order.status}</span></p>
            <p>Suma: {order.total?.toFixed(2)} PLN</p>
            <h4>Pozycje:</h4>
            <ul>
              {order.items?.map(item => (
                <li key={item.id}>{item.product?.name || 'Produkt usunięty'} - {item.quantity} szt. x {item.price?.toFixed(2)} PLN</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

export default App; 