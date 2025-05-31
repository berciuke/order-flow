import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ApiDebuggerHistory from './ApiDebuggerHistory';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrderItems, setCurrentOrderItems] = useState([]); 
  const [view, setView] = useState('products'); 
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [apiResponses, setApiResponses] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [productFormData, setProductFormData] = useState({ name: '', description: '', price: '', stock: '' });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const addApiResponse = (url, status, bodyObject, method = 'GET') => {
    const newResponse = {
      timestamp: new Date().toLocaleString(),
      method, 
      url: url,
      status: status,
      body: JSON.stringify(bodyObject, null, 2),
    };
    setApiResponses(prevResponses => [newResponse, ...prevResponses]);
  };

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    const endpoint = '/api/users/profile';
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        setCurrentUser(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać profilu użytkownika.');
      }
    } catch (err) {
      setError(`Błąd profilu: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
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

  const fetchProducts = useCallback(async () => {
    const endpoint = '/api/products';
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        setProducts(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać produktów.');
      }
    } catch (err) {
      setError(`Błąd produktów: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    const endpoint = '/api/orders';
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        setOrders(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać zamówień.');
      }
    } catch (err) {
      setError(`Błąd zamówień: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
    }
  }, [token]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    if (!token) return;
    const endpoint = `/api/orders/${orderId}`;
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        setSelectedOrderDetails(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać szczegółów zamówienia.');
      }
    } catch (err) {
      setError(`Błąd szczegółów zamówienia: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      alert(`Błąd pobierania szczegółów zamówienia: ${err.message}`);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders, fetchProducts]);

  const clearApiHistory = () => {
    setApiResponses([]);
  };

  const handleLogin = async (email, password) => {
    const endpoint = '/api/auth/login';
    const method = 'POST';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser({ id: data.userId, isAdmin: data.isAdmin }); 
        setView('products');
        setError('');
      } else {
        throw new Error(data.message || 'Błąd logowania.');
      }
    } catch (err) {
      setError(`Logowanie: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      alert(`Błąd logowania: ${err.message}`);
    }
  };

  const handleRegister = async (email, password, name) => {
    const endpoint = '/api/auth/register';
    const method = 'POST';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.status === 201) {
        alert('Rejestracja pomyślna! Możesz się teraz zalogować.');
        setView('login');
        setError('');
      } else {
        throw new Error(data.message || 'Błąd rejestracji.');
      }
    } catch (err) {
      setError(`Rejestracja: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
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
    const endpoint = '/api/orders';
    const method = 'POST';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: currentOrderItems.map(item => ({ productId: item.productId, quantity: item.quantity })) }),
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.status === 201) {
        alert('Zamówienie złożone pomyślnie!');
        setCurrentOrderItems([]);
        fetchOrders(); 
        setView('orders');
      } else {
        throw new Error(data.message || 'Nie udało się złożyć zamówienia.');
      }
    } catch (err) {
      setError(`Składanie zamówienia: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      alert(`Błąd składania zamówienia: ${err.message}`);
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({ name: product.name, description: product.description, price: product.price, stock: product.stock });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: '', description: '', price: '', stock: '' });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductFormData({ name: '', description: '', price: '', stock: '' });
  };

  const handleSaveProduct = async () => {
    if (!token || !currentUser?.isAdmin) {
      alert('Brak uprawnień.');
      return;
    }

    const { name, description, price, stock } = productFormData;
    if (!name || !description || price === '' || stock === '') {
        alert('Wszystkie pola są wymagane.');
        return;
    }
    
    const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10)
    };

    if (isNaN(productData.price) || isNaN(productData.stock)) {
        alert('Cena i ilość w magazynie muszą być liczbami.');
        return;
    }


    let endpoint = '/api/products';
    let method = 'POST';
    if (editingProduct) {
      endpoint = `/api/products/${editingProduct.id}`;
      method = 'PUT';
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok || res.status === 201) {
        alert(`Produkt ${editingProduct ? 'zaktualizowany' : 'dodany'} pomyślnie!`);
        closeProductModal();
        fetchProducts(); 
      } else {
        throw new Error(data.message || `Nie udało się ${editingProduct ? 'zaktualizować' : 'dodać'} produktu.`);
      }
    } catch (err) {
      setError(`Zapis produktu: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      alert(`Błąd zapisu produktu: ${err.message}`);
    }
  };

  const deleteProduct = async (productId) => {
    if (!token || !currentUser?.isAdmin) {
        alert('Brak uprawnień.');
        return;
    }
    const endpoint = `/api/products/${productId}`;
    const method = 'DELETE';
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
        });
        addApiResponse(endpoint, res.status, res.status === 204 ? { message: 'Produkt usunięty' } : await res.json(), method);
        if (res.ok) {
            alert('Produkt usunięty!');
            fetchProducts(); 
        } else {
            const data = await res.json();
            throw new Error(data.message || 'Nie udało się usunąć produktu.');
        }
    } catch (err) {
        setError(`Usuwanie produktu: ${err.message}`);
        if (err.message.includes("Unexpected end of JSON input") && err.response?.status === 204) {
             addApiResponse(endpoint, 204, { message: 'Produkt usunięty (info po błędzie parsowania)' }, method);
        } else {
             addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
        }
        alert(`Błąd usuwania produktu: ${err.message}`);
    }
  };
  
  // TODO: edycja produktu
  const editProduct = (product) => {
    alert(`Funkcjonalność edycji produktu (ID: ${product.id}) nie jest jeszcze zaimplementowana.`);
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
            onEditProduct={openProductModal}
          />
        )}

        {token && (view === 'orders' || view === 'products' ) && currentOrderItems.length > 0 && (
          <CurrentOrderView 
            items={currentOrderItems} 
            onUpdateQuantity={updateOrderItemQuantity}
            onPlaceOrder={handlePlaceOrder}
            isOrderView={view === 'orders'} 
          />
        )}

        {token && view === 'orders' && <OrdersListView orders={orders} onViewDetails={fetchOrderDetails} />}

        {selectedOrderDetails && (
          <OrderDetailsView order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
        )}

        {showProductModal && currentUser?.isAdmin && (
          <ProductFormModal
            product={editingProduct}
            formData={productFormData}
            onChange={handleProductFormChange}
            onSave={handleSaveProduct}
            onClose={closeProductModal}
          />
        )}
      </main>

      <ApiDebuggerHistory apiResponses={apiResponses} clearHistory={clearApiHistory} />

      <footer className="app-footer">
        <p>&copy; 2024 OrderFlow App</p>
      </footer>
    </div>
  );
}

function AuthForm({ type, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 

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

function ProductsView({ products, onAddToCart, currentUser, onDeleteProduct, onEditProduct }) {
  if (!products || products.length === 0) {
    return <p>Ładowanie produktów lub brak produktów do wyświetlenia.</p>;
  }
  return (
    <div className="products-view">
      <h2>Produkty</h2>
      {currentUser?.isAdmin && <button onClick={() => onEditProduct()} className="add-product-btn">Dodaj Nowy Produkt</button>}
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Cena: {product.price.toFixed(2)} zł</p>
            <p>W magazynie: {product.stock}</p>
            {currentUser?.isAdmin ? (
              <div className="admin-actions">
                <button onClick={() => onEditProduct(product)}>Edytuj</button>
                <button onClick={() => onDeleteProduct(product.id)} className="delete-btn">Usuń</button>
              </div>
            ) : (
              <button onClick={() => onAddToCart(product)} disabled={product.stock === 0}>
                {product.stock === 0 ? 'Brak w magazynie' : 'Dodaj do zamówienia'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  
function OrdersListView({ orders, onViewDetails }) {
    if (!orders || orders.length === 0) {
      return <p>Brak złożonych zamówień.</p>;
    }
  
    return (
      <div className="orders-list-view">
        <h2>Twoje Zamówienia</h2>
        <ul>
          {orders.map(order => (
            <li key={order.id} className="order-item-summary">
              <p>ID Zamówienia: {order.id}</p>
              <p>Status: {order.status}</p>
              <p>Suma: {order.total ? order.total.toFixed(2) : 'N/A'} zł</p>
              <p>Data: {new Date(order.createdAt).toLocaleDateString()}</p>
              <button onClick={() => onViewDetails(order.id)}>Zobacz szczegóły</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

function ProductFormModal({ product, formData, onChange, onSave, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content product-form-modal">
        <h3>{product ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}</h3>
        <label>Nazwa:</label>
        <input type="text" name="name" value={formData.name} onChange={onChange} placeholder="Nazwa produktu" />
        
        <label>Opis:</label>
        <textarea name="description" value={formData.description} onChange={onChange} placeholder="Opis produktu"></textarea>
        
        <label>Cena (zł):</label>
        <input type="number" name="price" value={formData.price} onChange={onChange} placeholder="0.00" step="0.01" />
        
        <label>Ilość w magazynie:</label>
        <input type="number" name="stock" value={formData.stock} onChange={onChange} placeholder="0" step="1" />
        
        <div className="modal-actions">
          <button onClick={onSave} className="save-btn">{product ? 'Zapisz zmiany' : 'Dodaj Produkt'}</button>
          <button onClick={onClose} className="cancel-btn">Anuluj</button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsView({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content order-details-modal">
        <h3>Szczegóły Zamówienia #{order.id}</h3>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Suma całkowita:</strong> {order.total ? order.total.toFixed(2) : 'N/A'} zł</p>
        <p><strong>Data złożenia:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        {order.user && <p><strong>Użytkownik:</strong> {order.user.name || order.user.email} (ID: {order.userId})</p>}
        
        <h4>Pozycje zamówienia:</h4>
        {order.items && order.items.length > 0 ? (
          <ul>
            {order.items.map(item => (
              <li key={item.id || item.productId}>
                {item.product ? item.product.name : `ID Produktu: ${item.productId}`} - 
                Ilość: {item.quantity} x {item.price ? item.price.toFixed(2) : (item.product?.price.toFixed(2) || 'N/A')} zł
              </li>
            ))}
          </ul>
        ) : <p>Brak pozycji w zamówieniu.</p>}
        
        <button onClick={onClose} className="close-btn">Zamknij</button>
      </div>
    </div>
  );
}

export default App; 