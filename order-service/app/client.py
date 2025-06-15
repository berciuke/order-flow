import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_access_token():
    data = {
        'grant_type': 'client_credentials',
        'client_id': os.getenv('CLIENT_ID'),
        'client_secret': os.getenv('CLIENT_SECRET')
    }
    
    response = requests.post(os.getenv('TOKEN_ENDPOINT'), data=data)
    return response.json()['access_token']

def call_api(endpoint):
    token = get_access_token()
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{os.getenv('RESOURCE_API')}{endpoint}", headers=headers)
    return response.json()

def main():
    print('Pobieranie tokenu...')
    token = get_access_token()
    print(f'Token: {token[:20]}...')
    
    print('Wywołanie API...')
    data = call_api('/api/data')
    print('Odpowiedź:', data)

if __name__ == "__main__":
    main() 