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

  const callAPI = async (endpoint) => {
    if (!auth) {
      setView('error');
      return;
    }

    setLoading(true);
    setError(null);

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
      }

      console.log("API success:", data);
    } catch (error) {
      console.error("API error:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
            </div>
          )}

          {view === "admin" && user?.realm_access?.roles?.includes("admin") && (
            <div className="card">
              <h2>Panel Administratora</h2>
              <button className="button" onClick={() => callAPI("/api/admin")}>
                Statystyki Platformy
              </button>
              <p>Zarządzanie platformą FitTrack</p>
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
              </div>
              
              {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                  <strong>Error:</strong> {error}
                </div>
              )}
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
