from fastapi import FastAPI
from app.client import get_access_token, call_api
import logging

app = FastAPI(title="FitTrack Training Service", description="Microservice for workout planning")

@app.get("/")
def root():
    return {"message": "FitTrack Training Service", "version": "1.0.0"}

@app.get("/api/training-plans")
def get_training_plans():
    return [
        {"id": 1, "name": "Beginner Full Body", "weeks": 8, "level": "beginner"},
        {"id": 2, "name": "Advanced Powerlifting", "weeks": 12, "level": "advanced"},
        {"id": 3, "name": "HIIT Cardio", "weeks": 6, "level": "intermediate"},
        {"id": 4, "name": "Yoga & Flexibility", "weeks": 10, "level": "beginner"}
    ]

@app.get("/api/create-workout")
def create_workout_plan():
    try:
        print('Training Service - tworzenie planu...')  
        token = get_access_token()
        print(f'Token: {token[:20]}...')
        
        workout_data = call_api('/api/workouts')
        print('Workout API Response:', workout_data)
        
        return {
            "status": "success", 
            "message": "Plan treningowy stworzony",
            "data": workout_data
        }
    except Exception as e:
        print('Error:', str(e))  
        return {"status": "error", "message": str(e)}

@app.get("/test-oauth2")
def test_oauth2():
    try:
        print('Training Service OAuth2 test...')  
        token = get_access_token()
        print(f'Token: {token[:20]}...')
        
        data = call_api('/api/exercises')
        print('Exercises API Response:', data)
        
        return {"status": "success", "service": "training", "data": data}
    except Exception as e:
        print('Error:', str(e))  
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)