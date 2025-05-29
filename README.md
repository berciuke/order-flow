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
- **Cache**: Redis (do cache’owania danych).

## Struktura katalogów

```plaintext
├── frontend
├── backend-api
├── order-service
├── docker-compose.yml
├── Dockerfiles
├── k8s-manifests
├── .dockerignore
├── README.md
└── docs
