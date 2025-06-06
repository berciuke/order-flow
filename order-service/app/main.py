from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Order Service",
    description="Mikroserwis do przetwarzania zamówień",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Order Service uruchomiony pomyślnie")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "order-service"}

@app.get("/")
async def root():
    return {"message": "Order Service API", "version": "1.0.0"}

@app.get("/orders/{order_id}")
async def get_order(order_id: int):
    return {"order_id": order_id, "status": "pending", "message": "Order Service działa poprawnie"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 