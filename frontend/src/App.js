import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ApiDebuggerHistory from './ApiDebuggerHistory';
import { useNotification } from './contexts/NotificationContext';
import NotificationContainer from './components/Notification/NotificationContainer';
import Button from './components/Button/Button';
import InputField from './components/InputField/InputField';
import Modal from './components/Modal/Modal';
import ProductCard from './components/Card/ProductCard';
import OrderCard from './components/Card/OrderCard';

const API_BASE_URL = '';
const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrderItems, setCurrentOrderItems] = useState([]); 
  const [view, setView] = useState('products'); 
  const [error, setError] = useState('');
  const [apiResponses, setApiResponses] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [productFormData, setProductFormData] = useState({ name: '', description: '', price: '', stock: '' });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  const { addNotification } = useNotification();

  const addApiResponse = useCallback((url, status, bodyObject, method = 'GET') => {
    const newResponse = {
      timestamp: new Date().toLocaleString(),
      method,
      url: url,
      status: status,
      body: JSON.stringify(bodyObject, null, 2),
    };
    setApiResponses(prevResponses => [newResponse, ...prevResponses]);
  }, []);

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
  }, [token, addApiResponse]);

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
      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textData = await res.text();
        console.error('Odpowiedź z /api/products nie jest JSON:', textData);
        addApiResponse(endpoint, res.status, { error: 'Serwer nie zwrócił danych w formacie JSON.', response: textData }, method);
        throw new Error(`Nie udało się pobrać produktów. Serwer zwrócił typ ${contentType || 'nieznany'} zamiast JSON.`);
      }
      
      addApiResponse(endpoint, res.status, data, method);

      if (res.ok) {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.data)) {
          console.log("Produkty znalezione w polu 'data'. Ustawianie setProducts(data.data)");
          setProducts(data.data);
        } else {
          console.warn("Oczekiwano tablicy produktów, otrzymano:", data, "Ustawiam pustą tablicę.");
          setProducts([]);
        }
      } else {
        const errorMessage = data?.message || `Nie udało się pobrać produktów (status: ${res.status}).`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(`Błąd produktów: ${err.message}`);
      if (!err.message.includes('Serwer nie zwrócił danych w formacie JSON.')) {
        addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      }
      setProducts([]);
    }
  }, [addApiResponse]);

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
  }, [token, addApiResponse]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    if (!token) return;
    const endpoint = `/api/orders/${orderId}`;
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
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
      addNotification({ message: `Błąd pobierania szczegółów zamówienia: ${err.message}`, type: 'error' });
    }
  }, [token, addApiResponse, addNotification]);

  const fetchProductDetails = useCallback(async (productId) => {
    const endpoint = `/api/products/${productId}`;
    const method = 'GET';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        setSelectedProductDetails(data);
      } else {
        throw new Error(data.message || 'Nie udało się pobrać szczegółów produktu.');
      }
    } catch (err) {
      setError(`Błąd szczegółów produktu: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd pobierania szczegółów produktu: ${err.message}`, type: 'error' });
    }
  }, [addApiResponse, addNotification]);

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

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
        console.log("Odpowiedź serwera (nie JSON):", data);
        if (!res.ok) {
            addApiResponse(endpoint, res.status, { message: data }, method);
            throw new Error(typeof data === 'string' && data.length < 200 ? data : 'Błąd logowania. Serwer nie zwrócił JSON.');
        }
      }
      
      addApiResponse(endpoint, res.status, data, method);

      if (res.ok && data && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser({ id: data.userId, isAdmin: data.isAdmin, email: email }); 
        setView('products');
        setError('');
        fetchUserProfile();
        fetchOrders();
      } else {
        const errorMessage = data?.message || (typeof data === 'string' ? data : 'Błąd logowania.');
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(`Logowanie: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd logowania: ${err.message}`, type: 'error' });
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
        addNotification({ message: 'Rejestracja pomyślna! Możesz się teraz zalogować.', type: 'success' });
        setView('login');
        setError('');
      } else {
        throw new Error(data.message || 'Błąd rejestracji.');
      }
    } catch (err) {
      setError(`Rejestracja: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd rejestracji: ${err.message}`, type: 'error' });
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
    addNotification({ message: `${product.name} dodano do zamówienia.`, type: 'success' });
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
      addNotification({ message: 'Musisz być zalogowany i mieć produkty w koszyku, aby złożyć zamówienie.', type: 'error' });
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
        addNotification({ message: 'Zamówienie złożone pomyślnie!', type: 'success' });
        setCurrentOrderItems([]);
        fetchOrders(); 
        setView('orders');
      } else {
        throw new Error(data.message || 'Nie udało się złożyć zamówienia.');
      }
    } catch (err) {
      setError(`Składanie zamówienia: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd składania zamówienia: ${err.message}`, type: 'error' });
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
      addNotification({ message: 'Brak uprawnień.', type: 'error' });
      return;
    }

    const { name, description, price, stock } = productFormData;
    if (!name || !description || price === '' || stock === '') {
        addNotification({ message: 'Wszystkie pola są wymagane.', type: 'error' });
        return;
    }
    
    const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10)
    };

    if (isNaN(productData.price) || isNaN(productData.stock)) {
        addNotification({ message: 'Cena i ilość w magazynie muszą być liczbami.', type: 'error' });
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
        addNotification({ message: `Produkt ${editingProduct ? 'zaktualizowany' : 'dodany'} pomyślnie!`, type: 'success' });
        closeProductModal();
        fetchProducts(); 
      } else {
        throw new Error(data.message || `Nie udało się ${editingProduct ? 'zaktualizować' : 'dodać'} produktu.`);
      }
    } catch (err) {
      setError(`Zapis produktu: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd zapisu produktu: ${err.message}`, type: 'error' });
    }
  };

  const deleteProduct = async (productId) => {
    if (!token || !currentUser?.isAdmin) {
        addNotification({ message: 'Brak uprawnień.', type: 'error' });
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
            addNotification({ message: 'Produkt usunięty!', type: 'success' });
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
        addNotification({ message: `Błąd usuwania produktu: ${err.message}`, type: 'error' });
    }
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!token || !currentUser?.isAdmin) {
      addNotification({ message: 'Brak uprawnień do zmiany statusu zamówienia.', type: 'error' });
      return;
    }
    const endpoint = `/api/orders/${orderId}`;
    const method = 'PUT';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      addApiResponse(endpoint, res.status, data, method);
      if (res.ok) {
        addNotification({ message: 'Status zamówienia zaktualizowany pomyślnie!', type: 'success' });
        fetchOrderDetails(orderId); // Odśwież szczegóły w modalu
        fetchOrders(); // Odśwież listę zamówień
      } else {
        throw new Error(data.message || 'Nie udało się zaktualizować statusu zamówienia.');
      }
    } catch (err) {
      setError(`Aktualizacja statusu zamówienia: ${err.message}`);
      addApiResponse(endpoint, err.response?.status || 500, { error: err.message }, method);
      addNotification({ message: `Błąd aktualizacji statusu zamówienia: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>OrderFlow</h1>
        <nav>
          {token && <Button variant="default" onClick={() => setView('products')}>Produkty</Button>}
          {token && <Button variant="default" onClick={() => { setView('orders'); fetchOrders(); }}>Moje Zamówienia</Button>}
          {token && (
            <div className="user-info">
              <span>Zalogowano jako: {currentUser?.email} {currentUser?.isAdmin && <span className="admin-badge">(Administrator)</span>}</span>
              <Button variant="default" onClick={handleLogout}>Wyloguj</Button>
            </div>
          )}
          {!token && <Button variant="default" onClick={() => setView('login')}>Logowanie</Button>}
          {!token && <Button variant="default" onClick={() => setView('register')}>Rejestracja</Button>}
        </nav>
      </header>

      {error && <div className="error-message">{error} <Button variant="default" onClick={() => setError('')}>X</Button></div>}

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
            onViewDetails={fetchProductDetails}
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

        {token && view === 'orders' && <OrdersListView orders={orders} onViewDetails={fetchOrderDetails} currentUser={currentUser} />}

        {selectedOrderDetails && (
          <OrderDetailsView 
            order={selectedOrderDetails} 
            onClose={() => setSelectedOrderDetails(null)}
            currentUser={currentUser}
            updateOrderStatus={updateOrderStatus}
            addNotification={addNotification}
          />
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

        {selectedProductDetails && (
          <ProductDetailsModal
            product={selectedProductDetails}
            onClose={() => setSelectedProductDetails(null)}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 OrderFlow App</p>
        <ApiDebuggerHistory apiResponses={apiResponses} clearHistory={clearApiHistory} />
      </footer>
      
      <NotificationContainer />
    </div>
  );
}

function AuthForm({ type, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Walidacja lokalna
    const newErrors = {};
    if (!email) newErrors.email = 'Email jest wymagany';
    if (!password) newErrors.password = 'Hasło jest wymagane';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
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
        <InputField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        
        <InputField
          label="Hasło"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        
        {type === 'register' && (
          <InputField
            label="Imię i Nazwisko (opcjonalnie)"
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        
        <Button 
          type="submit" 
          variant="primary" 
          className="button--full-width"
        >
          {type === 'login' ? 'Zaloguj' : 'Zarejestruj'}
        </Button>
      </form>
    </div>
  );
}

function ProductsView({ products, onAddToCart, currentUser, onDeleteProduct, onEditProduct, onViewDetails }) {
  if (!Array.isArray(products)) {
    return <p>Ładowanie produktów...</p>;
  }
  if (products.length === 0) {
    return (
      <div className="products-view">
        <h2>Produkty</h2>
        {currentUser?.isAdmin && (
          <>
            <p className="admin-info">Jako administrator możesz dodawać, edytować i usuwać produkty.</p>
            <Button onClick={() => onEditProduct()} className="add-product-btn">
              ➕ Dodaj Pierwszy Produkt
            </Button>
          </>
        )}
        {!currentUser?.isAdmin && <p>Brak produktów do wyświetlenia.</p>}
      </div>
    );
  }
  return (
    <div className="products-view">
      <h2>Produkty</h2>
      {currentUser?.isAdmin && (
        <div className="admin-controls">
          <Button onClick={() => onEditProduct()} className="add-product-btn">
            ➕ Dodaj Nowy Produkt
          </Button>
          <p className="admin-info">Panel administratora: możesz zarządzać wszystkimi produktami</p>
        </div>
      )}
      <div className="products-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
            onViewDetails={onViewDetails}
            currentUser={currentUser}
          />
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
                    <Button variant="default" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}>-</Button>
                    <span>Ilość: {item.quantity}</span>
                    <Button variant="default" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}>+</Button>
                    <Button variant="danger" className="remove-item-btn" onClick={() => onUpdateQuantity(item.productId, 0)}>Usuń</Button>
                  </div>
                  <span>Suma: {(item.price * item.quantity).toFixed(2)} PLN</span>
                </li>
              ))}
            </ul>
            <div className="current-order-summary">
                <p>Łączna kwota: <strong>{totalPrice.toFixed(2)} PLN</strong></p>
                <Button variant="primary" onClick={onPlaceOrder} className="place-order-button">Złóż zamówienie</Button>
            </div>
          </>
        )}
      </div>
    );
  }
  
function OrdersListView({ orders, onViewDetails, currentUser }) {
    if (!orders || orders.length === 0) {
      return <p>Brak złożonych zamówień.</p>;
    }
  
    return (
      <div className="orders-list-view">
        <h2>Twoje Zamówienia</h2>
        <div className="orders-grid">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={onViewDetails}
              currentUser={currentUser}
            />
          ))}
        </div>
      </div>
    );
  }

function ProductFormModal({ product, formData, onChange, onSave, onClose }) {
  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={product ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}
    >
      <InputField
        label="Nazwa"
        type="text"
        name="name"
        value={formData.name}
        onChange={onChange}
        placeholder="Nazwa produktu"
        required
      />
      
      <div className="input-field">
        <label className="input-field__label">Opis *</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={onChange} 
          placeholder="Opis produktu"
          className="input-field__input"
          rows="4"
        />
      </div>
      
      <InputField
        label="Cena (zł)"
        type="number"
        name="price"
        value={formData.price}
        onChange={onChange}
        placeholder="0.00"
        step="0.01"
        required
      />
      
      <InputField
        label="Ilość w magazynie"
        type="number"
        name="stock"
        value={formData.stock}
        onChange={onChange}
        placeholder="0"
        step="1"
        required
      />
      
      <div className="modal-actions" style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <Button variant="primary" onClick={onSave}>
          {product ? 'Zapisz zmiany' : 'Dodaj Produkt'}
        </Button>
        <Button variant="default" onClick={onClose}>
          Anuluj
        </Button>
      </div>
    </Modal>
  );
}

function OrderDetailsView({ order, onClose, currentUser, updateOrderStatus, addNotification }) {
  const [selectedStatusForEdit, setSelectedStatusForEdit] = useState(order ? order.status : '');

  useEffect(() => {
    if (order) {
      setSelectedStatusForEdit(order.status);
    }
  }, [order]);

  if (!order) return null;

  const handleStatusSave = () => {
    if (updateOrderStatus && order.id && selectedStatusForEdit !== order.status) {
      updateOrderStatus(order.id, selectedStatusForEdit);
    } else if (selectedStatusForEdit === order.status) {
      addNotification({ message: 'Nie wybrano nowego statusu.', type: 'error' });
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Szczegóły Zamówienia #${order.id}`}
    >
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

      {currentUser?.isAdmin && (
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
          <h4>Zmień status zamówienia:</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
            <select 
              name="status" 
              value={selectedStatusForEdit} 
              onChange={(e) => setSelectedStatusForEdit(e.target.value)}
              style={{ 
                padding: '8px', 
                borderRadius: 'var(--border-radius)', 
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--on-surface-color)'
              }}
            >
              {ORDER_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Button variant="secondary" onClick={handleStatusSave}>
              Zapisz status
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ProductDetailsModal({ product, onClose }) {
  if (!product) return null;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Szczegóły Produktu: ${product.name}`}
    >
      <p><strong>ID:</strong> {product.id}</p>
      <p><strong>Opis:</strong> {product.description}</p>
      <p><strong>Cena:</strong> {product.price?.toFixed(2)} zł</p>
      <p><strong>W magazynie:</strong> {product.stock}</p>
      <p><strong>Utworzono:</strong> {new Date(product.createdAt).toLocaleString()}</p>
      <p><strong>Ostatnia aktualizacja:</strong> {new Date(product.updatedAt).toLocaleString()}</p>
    </Modal>
  );
}

export default App; 