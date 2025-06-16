import logging
from fastapi import FastAPI, HTTPException
from app.client import get_access_token, call_api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FitTrack Training Service", 
    description="Microservice for workout planning",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "training-service", 
        "version": "1.0.0"
    }

@app.get("/api/training-plans")
def get_training_plans():
    logger.info("Fetching training plans")
    return [
        {"id": 1, "name": "Beginner Full Body", "weeks": 8, "level": "beginner"}, 
        {"id": 2, "name": "Advanced Powerlifting", "weeks": 12, "level": "advanced"},
        {"id": 3, "name": "HIIT Cardio", "weeks": 6, "level": "intermediate"},
        {"id": 4, "name": "Yoga & Flexibility", "weeks": 10, "level": "beginner"}
    ]

@app.post("/api/sync-exercises")
async def sync_exercises():
    try:
        logger.info("Starting exercise sync with backend API")
        
        token = get_access_token()
        logger.info("OAuth2 token obtained")
        
        exercises_data = call_api('/api/exercises')
        logger.info(f"Retrieved {len(exercises_data)} exercises from backend")
        
        enhanced_exercises = []
        for exercise in exercises_data:
            enhanced_exercises.append({
                **exercise,
                "training_service_processed": True,
                "recommended_sets": 3 if exercise['difficulty'] == 'beginner' else 4,
                "recommended_reps": "8-12" if exercise['difficulty'] == 'beginner' else "6-10"
            })
        
        return {
            "status": "success",
            "message": f"Synced {len(enhanced_exercises)} exercises",
            "data": enhanced_exercises
        }
        
    except Exception as e:
        logger.error(f"❌ Exercise sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@app.get("/test-oauth2")
def test_oauth2():
    try:
        logger.info("Testing OAuth2 integration...")
        
        token = get_access_token()
        logger.info("Token obtained successfully")
        
        data = call_api('/api/exercises')
        logger.info("Backend API call successful")
        
        return {
            "status": "success", 
            "service": "training-service",
            "backend_integration": "working",
            "exercises_count": len(data),
            "sample_exercise": data[0] if data else None
        }
    except Exception as e:
        logger.error(f"❌ OAuth2 test failed: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)