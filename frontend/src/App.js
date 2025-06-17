import React, { useState, useEffect } from "react";
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.REACT_APP_KEYCLOAK_REALM || "oauth2-app",
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || "spa-client",
});

function App() {
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState("home");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [googleData, setGoogleData] = useState(null);
  const [bookQuery, setBookQuery] = useState('fitness');
  const [trainingData, setTrainingData] = useState(null);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false, 
      })
      .then((authenticated) => {
        setAuth(authenticated);
        setLoading(false);

        if (authenticated) {
          setUser(keycloak.tokenParsed);
          console.log("Zalogowany:", keycloak.tokenParsed.preferred_username);
        }
      })
      .catch((error) => {
        console.error("Keycloak error:", error);
        setLoading(false);
      });
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const callAPI = async (endpoint) => {
    if (!auth) {
      setView('error');
      return;
    }

    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      if (keycloak.isTokenExpired()) {
        await keycloak.updateToken(30);
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (endpoint === "/api/exercises") {
        setExercises(data);
      } else if (endpoint === "/api/workouts") {
        setWorkouts(data.workouts || data);
      } else if (endpoint === "/api/admin/users") {
        setUsers(data.users || data);
      } else if (endpoint === "/api/admin/roles") {
        setRoles(data.roles || data);
      } else if (endpoint.includes("/google")) {
        setGoogleData(data);
      }

      console.log("API success:", data);
      setApiResponse({ endpoint, data, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("API error:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/external/google-auth`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      
      const data = await response.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get Google authorization URL');
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setError(`Google connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGoogleProfile = () => {
    callAPI('/api/external/google-profile');
  };

  const searchGoogleBooks = (query = 'fitness') => {
    callAPI(`/api/external/google-books?q=${encodeURIComponent(query)}`);
  };

  const disconnectGoogle = async () => {
    try {
      setGoogleData(null);
      const response = await fetch('/api/external/google-disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setGoogleData({ message: 'Google disconnected successfully', disconnected: true });
      }
    } catch (error) {
      console.error('Google disconnect error:', error);
      setGoogleData({ error: 'Failed to disconnect Google', details: error.message });
    }
  };

  const callTrainingAPI = async (endpoint) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8001${endpoint}`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      
      const data = await response.json();
      setTrainingData(data);
      console.log("Training API success:", data);
    } catch (error) {
      console.error("Training API error:", error);
      setError(`Training Service failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ApiResponseDisplay = ({ show = true }) => {
    if (!show) return null;
    
    return (
      <>
        {error && (
          <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {apiResponse && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#e8f5e8', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Last API Response</h4>
            <p><strong>Endpoint:</strong> {apiResponse.endpoint}</p>
            <p><strong>Time:</strong> {new Date(apiResponse.timestamp).toLocaleString()}</p>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Data (click to expand)</summary>
              <div style={{ marginTop: '10px', background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                <pre style={{ margin: '0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </>
    );
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'google-oauth') {
      const exchangeToken = async () => {
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:8000/api/external/google-callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${keycloak.token}`,
            },
            body: JSON.stringify({ code })
          });
          
          const data = await response.json();
          if (data.success) {
            setGoogleData(data);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError(`OAuth callback failed: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      
      exchangeToken();
    }
  }, [auth, keycloak.token]);

  if (loading) {
    return (
      <div className="container">
        <h1>Ładowanie...</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>FitTrack Dashboard</h1>
        <p>Twoja platforma fitness z OAuth2</p>

        {auth ? (
          <div>
            <p>
              Witaj <strong>{user?.preferred_username}</strong>!
            </p>
            <p>Role: {user?.realm_access?.roles?.join(", ") || "athlete"}</p>
            {user?.realm_access?.roles?.includes("coach") && (
              <span>Trener</span>
            )}
            {user?.realm_access?.roles?.includes("admin") && <span>Admin</span>}
            <button className="button" onClick={logout}>
              Wyloguj
            </button>
          </div>
        ) : (
          <button className="button" onClick={login}>
            Zaloguj przez Keycloak
          </button>
        )}
      </div>

      {auth && (
        <div>
          <div className="nav">
            <button className="button" onClick={() => setView("exercises")}>
              Ćwiczenia
            </button>
            <button className="button" onClick={() => setView("workouts")}>
              Moje Treningi
            </button>
            {user?.realm_access?.roles?.includes("coach") && (
              <button className="button" onClick={() => setView("coach")}>
                Panel Trenera
              </button>
            )}
            {user?.realm_access?.roles?.includes("admin") && (
              <button className="button" onClick={() => setView("admin")}>
                Panel Admina
              </button>
            )}
            <button className="button" onClick={() => setView("google")}>
              Google Integration
            </button>
            <button className="button" onClick={() => setView("training")}>
              Training Service
            </button>
            <button className="button" onClick={() => setView("api")}>
              Test API
            </button>
          </div>

          {view === "exercises" && (
            <div className="card">
              <h2>Baza Ćwiczeń</h2>
              <button
                className="button"
                onClick={() => callAPI("/api/exercises")}
              >
                Pobierz ćwiczenia
              </button>
              {exercises.map((exercise) => (
                <div key={exercise.id} className="card">
                  <h3>{exercise.name}</h3>
                  <p>Grupa mięśni: {exercise.muscle_group}</p>
                  <p>Poziom: {exercise.difficulty}</p>
                  <p>Kalorie: {exercise.calories}/min</p>
                </div>
              ))}
              
              <ApiResponseDisplay />
            </div>
          )}

          {view === "workouts" && (
            <div className="card">
              <h2>Moje Plany Treningowe</h2>
              <button
                className="button"
                onClick={() => callAPI("/api/workouts")}
              >
                Pobierz treningi
              </button>
              {workouts.map((workout) => (
                <div key={workout.id} className="card">
                  <h3>{workout.name}</h3>
                  <p>Czas: {workout.duration} min</p>
                  <p>Ćwiczenia: {workout.exercises?.join(", ")}</p>
                </div>
              ))}
              
              <ApiResponseDisplay />
            </div>
          )}

          {view === "coach" && user?.realm_access?.roles?.includes("coach") && (
            <div className="card">
              <h2>Panel Trenera</h2>
              <button
                className="button"
                onClick={() => callAPI("/api/coach-panel")}
              >
                Moi Podopieczni
              </button>
              <p>Funkcje dla trenerów personalnych</p>
              
              <ApiResponseDisplay />
            </div>
          )}

          {view === "admin" && user?.realm_access?.roles?.includes("admin") && (
            <div className="card">
              <h2>Panel Administratora</h2>
              <p><strong>User Management</strong> - zgodnie z wymaganiami zaliczeniowymi</p>
              
              <div style={{ marginBottom: '20px' }}>
                <button className="button" onClick={() => callAPI("/api/admin/users")}>
                  Lista Użytkowników
                </button>
                <button className="button" onClick={() => callAPI("/api/admin/roles")}>
                  Lista Ról
                </button>
                <button className="button" onClick={() => {setUsers([]); setRoles([]); setApiResponse(null);}}>
                  Wyczyść
                </button>
              </div>

              <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
                <h4>Dodaj Nowego Użytkownika</h4>
                <div id="create-user-form">
                  <input 
                    id="new-username" 
                    type="text" 
                    placeholder="Nazwa użytkownika"
                    style={{ padding: '8px', margin: '5px', width: '150px' }}
                  />
                  <input 
                    id="new-email" 
                    type="email" 
                    placeholder="Email"
                    style={{ padding: '8px', margin: '5px', width: '200px' }}
                  />
                  <input 
                    id="new-password" 
                    type="password" 
                    placeholder="Hasło"
                    style={{ padding: '8px', margin: '5px', width: '150px' }}
                  />
                  <select 
                    id="new-role" 
                    style={{ padding: '8px', margin: '5px' }}
                  >
                    <option value="user">user</option>
                    <option value="coach">coach</option>
                    <option value="admin">admin</option>
                  </select>
                  <button 
                    className="button" 
                    onClick={async () => {
                      const username = document.getElementById('new-username').value;
                      const email = document.getElementById('new-email').value;
                      const password = document.getElementById('new-password').value;
                      const role = document.getElementById('new-role').value;
                      
                      if (!username || !email || !password) {
                        alert('Wszystkie pola są wymagane!');
                        return;
                      }
                      
                      try {
                        setLoading(true);
                        const response = await fetch('http://localhost:8000/api/admin/users', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${keycloak.token}`
                          },
                          body: JSON.stringify({
                            username,
                            email,
                            password,
                            roles: [role]
                          })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          alert('Użytkownik utworzony: ' + data.message);
                          document.getElementById('new-username').value = '';
                          document.getElementById('new-email').value = '';
                          document.getElementById('new-password').value = '';
                          callAPI("/api/admin/users");
                        } else {
                          alert('Błąd: ' + data.error);
                        }
                      } catch (error) {
                        alert('Błąd: ' + error.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    Utwórz Użytkownika
                  </button>
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <h3>Użytkownicy w systemie ({users.length}):</h3>
                  {users.map((user) => (
                    <div key={user.id} className="card" style={{ margin: '10px 0', padding: '10px' }}>
                      <p><strong>{user.username}</strong> ({user.email})</p>
                      <p>Role: {user.roles?.join(", ") || "brak"}</p>
                      <p>Status: {user.enabled ? "Aktywny" : "Nieaktywny"}</p>
                      <p>Utworzony: {user.created}</p>
                      <small>ID: {user.id}</small>
                    </div>
                  ))}
                </div>
              )}

              {roles.length > 0 && (
                <div>
                  <h3>Role w systemie ({roles.length}):</h3>
                  {roles.map((role) => (
                    <div key={role.name} className="card" style={{ margin: '10px 0', padding: '10px' }}>
                      <p><strong>{role.name}</strong></p>
                      <p>Opis: {role.description}</p>
                      <p>Użytkowników: {role.users}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0' }}>
                <h4>Funkcje User Management</h4>
                <p>Pobieranie listy użytkowników z Keycloak</p>
                <p>Wyświetlanie ról (admin, coach, user)</p>
                <p>Tworzenie nowych użytkowników - API ready</p>
                <p>Przypisywanie ról - API ready</p>
                <p>Reset hasła - API ready</p>
                <small>Endpointy: POST /api/admin/users, PUT /api/admin/users/:id/roles</small>
              </div>
              
              <ApiResponseDisplay />
            </div>
          )}

          {view === "google" && (
            <div className="card">
              <h2>Google Integration</h2>
              <p><strong>External OAuth2 API</strong> - zgodnie z wymaganiami zaliczeniowymi</p>
              
              <div style={{ marginBottom: '20px' }}>
                <button className="button" onClick={connectGoogle}>
                  Połącz z Google
                </button>
                <button className="button" onClick={getGoogleProfile}>
                  Mój Profil
                </button>
                <button className="button" onClick={() => callAPI('/api/external/google-status')}>
                  Status Google
                </button>
                <button className="button" onClick={disconnectGoogle} style={{ backgroundColor: '#e74c3c' }}>
                  Wyloguj Google
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4>Wyszukaj książki:</h4>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="Wpisz frazę do wyszukania..."
                  style={{ padding: '8px', marginRight: '10px', width: '200px' }}
                />
                <button className="button" onClick={() => searchGoogleBooks(bookQuery)}>
                  Szukaj książek
                </button>
              </div>

              {googleData && (
                <div>
                  {(googleData.user || googleData.profile) && (
                    <div className="card" style={{ background: '#4285f4', color: 'white' }}>
                      <h3>Profil Google</h3>
                      <p><strong>{googleData.user?.name || googleData.profile?.name}</strong></p>
                      <p>Email: {googleData.user?.email || googleData.profile?.email}</p>
                      <p>ID: {googleData.user?.id || googleData.profile?.id}</p>
                      {(googleData.user?.photo || googleData.profile?.picture) && (
                        <img src={googleData.user?.photo || googleData.profile?.picture} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                      )}
                    </div>
                  )}

                  {googleData.books && (
                    <div>
                      <h3>{googleData.message || 'Książki'}</h3>
                      <p>Znaleziono: {googleData.books.length} książek</p>
                      {googleData.books.map((book, index) => (
                        <div key={book.id || index} className="card" style={{ margin: '10px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <h4>{book.title || 'Brak tytułu'}</h4>
                              <p>Autorzy: {book.authors?.join(', ') || 'Nieznany'}</p>
                              <p>Opis: {book.description || 'Brak opisu'}</p>
                            </div>
                            {book.thumbnail && (
                              <img src={book.thumbnail} alt="Book cover" style={{ width: '60px', height: 'auto', marginLeft: '10px' }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {googleData.authorized !== undefined && (
                    <div className="card" style={{ background: googleData.authorized ? '#4CAF50' : '#FF9800', color: 'white' }}>
                      <h3>Status Google Authorization</h3>
                      <p>{googleData.message}</p>
                      {googleData.expiresAt && (
                        <p>Wygasa: {new Date(googleData.expiresAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}

                  {googleData.disconnected && (
                    <div className="card" style={{ background: '#4CAF50', color: 'white' }}>
                      <h3>Google Disconnected</h3>
                      <p>{googleData.message}</p>
                    </div>
                  )}

                  {googleData.error && (
                    <div className="card" style={{ background: '#f44336', color: 'white' }}>
                      <h3>Błąd</h3>
                      <p>{googleData.error}</p>
                      {googleData.details && <p><small>{googleData.details}</small></p>}
                      {googleData.reauthorizeNeeded && (
                        <button 
                          className="button" 
                          onClick={connectGoogle}
                          style={{ marginTop: '10px', backgroundColor: '#fff', color: '#f44336' }}
                        >
                          Ponowna autoryzacja
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0' }}>
                <h4>Google OAuth2 Features</h4>
                <p>Authorization Code Flow - user profile, books</p>
                <p>Client Credentials Flow - public books</p>
                <p>Backend Proxy - secure token handling</p>
                <p>Real OAuth2 integration z external API</p>
                <small>Endpointy: /api/external/google-auth, /api/external/google-books</small>
              </div>
            </div>
          )}

          {view === "training" && (
            <div className="card">
              <h2>Training Service Demo</h2>
              <p><strong>Mikroservice Training</strong> - port 8001</p>
              
              <div style={{ marginBottom: '20px' }}>
                <button className="button" onClick={() => callTrainingAPI('/api/training-plans')}>
                  Plany Treningowe
                </button>
                <button className="button" onClick={() => callTrainingAPI('/api/sync-exercises')}>
                  Sync Ćwiczenia
                </button>
                <button className="button" onClick={() => callTrainingAPI('/test-oauth2')}>
                  Test OAuth2
                </button>
                <button className="button" onClick={() => callTrainingAPI('/health')}>
                  Health Check
                </button>
              </div>

              {trainingData && (
                <div className="card" style={{ background: '#e8f5e8' }}>
                  <h3>Training Service Response</h3>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(trainingData, null, 2)}
                  </pre>
                </div>
              )}
              
              <ApiResponseDisplay />
            </div>
          )}



          {view === "api" && (
            <div className="card">
              <h2>Test API OAuth2</h2>
              <p>
                <strong>Token:</strong> {keycloak.token?.substring(0, 50)}...
              </p>
              <p>
                <strong>User:</strong> {user?.preferred_username}
              </p>
              <p>
                <strong>Roles:</strong> {user?.realm_access?.roles?.join(", ")}
              </p>

              <div>
                <button
                  className="button"
                  onClick={() => callAPI("/api/exercises")}
                >
                  Test Exercises
                </button>
                <button
                  className="button"
                  onClick={() => callAPI("/api/workouts")}
                >
                  Test Workouts
                </button>
                <button
                  className="button"
                  onClick={() => callAPI("/api/admin")}
                >
                  Test Admin
                </button>
                <button
                  className="button"
                  onClick={() => { setApiResponse(null); setError(null); }}
                  style={{ backgroundColor: '#95a5a6' }}
                >
                  Clear
                </button>
              </div>
              
              <ApiResponseDisplay />
            </div>
          )}
        </div>
      )}

      {!auth && (
        <div className="card">
          <h2>Wymagane logowanie</h2>
          <p>Zaloguj się przez Keycloak</p>
          <p>
            <strong>Keycloak URL:</strong>{" "}
            {process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080"}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
