# OrderFlow – System zarządzania zamówieniami e-commerce

## Opis projektu

Orderflow to aplikacja oparta o architekturę mikroserwisową, służąca do obsługi, przetwarzania i zarządzania zamówieniami w sklepie internetowym. Aplikacja zbudowana jest z jasno wydzielonych mikroserwisów, komunikujących się za pomocą REST API oraz kolejki zdarzeń.

## Architektura aplikacji

### Komponenty podstawowe:

- **Frontend** (React):
  - Interfejs użytkownika do składania zamówień.
  - Wyświetlanie statusu zamówień.
  
- **Backend API** (Node.js):
  - Obsługa autoryzacji użytkowników.
  - Wystawianie REST API do obsługi zamówień oraz danych produktów i użytkowników.

- **Order Service** (Python):
  - Dedykowany mikroserwis przetwarzający zdarzenia dotyczące nowych zamówień.
  - Odpowiedzialny za zapis danych do bazy oraz aktualizację statusów.

### Komponenty pomocnicze:

- **Kolejka zdarzeń**: RabbitMQ – asynchroniczna komunikacja między mikroserwisami.
- **Baza danych**: PostgreSQL (dane strukturalne).
- **Cache**: Redis (do cache'owania danych).

## Struktura katalogów

```plaintext
├── frontend/
│   ├── Dockerfile         
│   └── .dockerignore     
backend-api/
├── src/
│   ├── controllers/   
│   ├── middleware/    
│   ├── models/        # Modele Prisma 
│   ├── routes/        
│   ├── services/      
│   ├── utils/         
│   └── server.ts      # Główny plik serwera
├── prisma/            # Schema bazy danych
├── package.json
├── tsconfig.json
└── Dockerfile   
├── order-service/
│   ├── Dockerfile         
│   └── .dockerignore      
├── docker-compose.yml
├── k8s-manifests/        
├── docs/                  
├── .gitignore             
├── README.md              
└── ... (inne pliki konfiguracyjne, skrypty, itp. na poziomie głównym)
