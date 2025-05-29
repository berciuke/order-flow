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

### Użytkownicy

- `POST /api/auth/register` - Rejestracja
- `POST /api/auth/login` - Logowanie
- `GET /api/users/profile` - Profil użytkownika

### Produkty

- `GET /api/products` - Lista produktów
- `GET /api/products/:id` - Szczegóły produktu

### Zamówienia

- `POST /api/orders` - Utworzenie zamówienia
- `GET /api/orders` - Lista zamówień użytkownika
- `GET /api/orders/:id` - Szczegóły zamówienia

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
