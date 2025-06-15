from fastapi import FastAPI
from app.client import get_access_token, call_api
import logging

app = FastAPI()

@app.get("/")
def root():
    return {"message": "B2B Client"}

@app.get("/test-oauth2")
def test_oauth2():
    try:
        print('B2B OAuth2 test...')  
        token = get_access_token()
        print(f'Token: {token[:20]}...')
        
        data = call_api('/api/data')
        print('API Response:', data)
        
        return {"status": "success", "data": data}
    except Exception as e:
        print('Error:', str(e))  
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 