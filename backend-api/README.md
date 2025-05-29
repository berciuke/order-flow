# Backend API Service - Node.js

## Opis

Ta usługa odpowiada za główne API aplikacji OrderFlow. Zbudowana w Node.js z Express, zapewnia:

- REST API do obsługi zamówień (`/api/orders`)
- Zarządzanie danymi użytkowników (`/api/users`)
- Zarządzanie produktami (`/api/products`)
- Autoryzację i autentykację użytkowników
- Publikowanie zdarzeń do RabbitMQ
- Komunikację z bazą danych PostgreSQL

## Technologie

- **Node.js 18**
- **Express.js** (framework web)
- **TypeScript**
- **Prisma** (ORM do PostgreSQL)
- **amqplib** (klient RabbitMQ)
- **jsonwebtoken** (JWT)
- **bcryptjs** (hashowanie haseł)
- **joi** (walidacja)
- **winston** (logging)

## Endpointy API

### Autoryzacja (`/api/auth`)

- **`POST /api/auth/register`**
  - Opis: Rejestracja nowego użytkownika.
  - Request Body: `{ "email": "user@example.com", "password": "password123", "name": "Jan Kowalski" (opcjonalnie) }`
  - Response (201): `{ "message": "Użytkownik zarejestrowany pomyślnie.", "userId": "string" }`
  - Response (400): Błąd walidacji lub użytkownik już istnieje.

- **`POST /api/auth/login`**
  - Opis: Logowanie użytkownika.
  - Request Body: `{ "email": "user@example.com", "password": "password123" }`
  - Response (200): `{ "token": "string (JWT)", "userId": "string", "isAdmin": boolean }`
  - Response (401): Nieprawidłowe dane logowania.

### Użytkownicy (`/api/users`)

- **`GET /api/users/profile`**
  - Opis: Pobiera profil zalogowanego użytkownika.
  - Zabezpieczenie: Wymagany token JWT w nagłówku `Authorization: Bearer <token>`.
  - Response (200): `{ "id": "string", "email": "string", "name": "string", "isAdmin": boolean, "createdAt": "date-time", "updatedAt": "date-time" }`
  - Response (401): Brak autoryzacji.
  - Response (404): Użytkownik nie znaleziony.

### Produkty (`/api/products`)

- **`GET /api/products`**
  - Opis: Pobiera listę wszystkich produktów.
  - Response (200): `[ { "id": "string", "name": "string", "description": "string", "price": number, "stock": number, "createdAt": "date-time", "updatedAt": "date-time" } ]`

- **`GET /api/products/:id`**
  - Opis: Pobiera szczegóły konkretnego produktu.
  - Response (200): `{ "id": "string", "name": "string", "description": "string", "price": number, "stock": number, "createdAt": "date-time", "updatedAt": "date-time" }`
  - Response (404): Produkt nie znaleziony.

- **`POST /api/products`**
  - Opis: Dodaje nowy produkt.
  - Zabezpieczenie: Wymagany token JWT administratora.
  - Request Body: `{ "name": "Nowy Produkt", "description": "Opis produktu", "price": 199.99, "stock": 100 }`
  - Response (201): `{ "id": "string", ... (dane produktu) }`
  - Response (400): Błąd walidacji.
  - Response (401/403): Brak autoryzacji / brak uprawnień administratora.

- **`PUT /api/products/:id`**
  - Opis: Aktualizuje istniejący produkt.
  - Zabezpieczenie: Wymagany token JWT administratora.
  - Request Body: `{ "name": "Zaktualizowana Nazwa", "price": 249.99 (dowolne pola do aktualizacji) }`
  - Response (200): `{ "id": "string", ... (zaktualizowane dane produktu) }`
  - Response (400): Błąd walidacji (np. brak pól do aktualizacji).
  - Response (401/403): Brak autoryzacji / brak uprawnień administratora.
  - Response (404): Produkt nie znaleziony.

- **`DELETE /api/products/:id`**
  - Opis: Usuwa produkt.
  - Zabezpieczenie: Wymagany token JWT administratora.
  - Response (204): No Content.
  - Response (401/403): Brak autoryzacji / brak uprawnień administratora.
  - Response (404): Produkt nie znaleziony.

### Zamówienia (`/api/orders`)

- **`POST /api/orders`**
  - Opis: Tworzy nowe zamówienie dla zalogowanego użytkownika.
  - Zabezpieczenie: Wymagany token JWT.
  - Request Body: `{ "items": [ { "productId": "string", "quantity": number } ] }`
  - Response (201): `{ "id": "string", "userId": "string", "total": number, "status": "PENDING", "items": [ ... ], "createdAt": "date-time", "updatedAt": "date-time" }`
  - Response (400): Błąd walidacji, niewystarczający stan magazynowy.
  - Response (401): Brak autoryzacji.
  - Response (404): Produkt w zamówieniu nie znaleziony.

- **`GET /api/orders`**
  - Opis: Pobiera listę zamówień zalogowanego użytkownika.
  - Zabezpieczenie: Wymagany token JWT.
  - Response (200): `[ { ... (dane zamówienia z pozycjami i produktami) } ]`
  - Response (401): Brak autoryzacji.

- **`GET /api/orders/:id`**
  - Opis: Pobiera szczegóły konkretnego zamówienia. Dostępne dla właściciela zamówienia lub administratora.
  - Zabezpieczenie: Wymagany token JWT.
  - Response (200): `{ ... (szczegółowe dane zamówienia z pozycjami, produktami i użytkownikiem) }`
  - Response (401): Brak autoryzacji.
  - Response (403): Brak uprawnień do wyświetlenia tego zamówienia.
  - Response (404): Zamówienie nie znalezione.

### System

- `GET /health` - Health check

## Struktura

```
backend-api/
├── src/
│   ├── controllers/   # Kontrolery Express
│   ├── middleware/    # Middleware (auth, validation, etc.)
│   ├── models/        # Modele Prisma
│   ├── routes/        # Definicje tras
│   ├── services/      # Logika biznesowa
│   ├── utils/         # Utilities
│   └── server.ts      # Główny plik serwera
├── prisma/            # Schema bazy danych
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Uruchomienie (na początku ręcznie :-))

### Lokalnie (development)

```bash
npm install
npm run dev
```

### Docker (domyślnie - produkcja)

```bash
docker build -t orderflow-backend-api .
docker run -p 8000:8000 orderflow-backend-api
```
### Docker deweloperskie środowisko

```bash
docker build --target development -t my-backend-dev .
docker run -p 8000:8000 my-backend-dev
```

## Zmienne środowiskowe

- `DATABASE_URL` - Connection string do PostgreSQL
- `RABBITMQ_URL` - Connection string do RabbitMQ
- `JWT_SECRET` - Klucz do podpisywania JWT
- `NODE_ENV` - Środowisko (development/production)
- `PORT` - Port serwera (domyślnie 8000)
