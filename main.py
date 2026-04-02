from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

CACHE_TTL = 600  # seconds
weather_cache = {}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.get("/weather/{city}")
async def get_weather(city: str):
    api_key = os.getenv("API_KEY")
    print(f"[DEBUG] /weather/{city} called, api_key present={bool(api_key)}")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")

    city_key = city.strip().lower()
    now = time.time()
    if city_key in weather_cache:
        entry = weather_cache[city_key]
        if now - entry["ts"] < CACHE_TTL:
            print(f"[DEBUG] cache hit for {city_key}")
            return entry["data"]

    def fetch_forecast(query):
        url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={query}&days=3"
        print(f"[DEBUG] weatherapi request url={url}")
        try:
            r = requests.get(url, timeout=8)
            print(f"[DEBUG] weatherapi response status={r.status_code}, text={r.text[:200]}")
            return r
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="Weather API request timed out")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=503, detail=f"Weather API request failed: {e}")

    response = fetch_forecast(city)

    if response.status_code in (400, 204, 404):
        search_url = f"https://api.weatherapi.com/v1/search.json?key={api_key}&q={city}"
        search_response = requests.get(search_url, timeout=8)
        if search_response.status_code == 200:
            candidates = search_response.json()
            if not candidates:
                raise HTTPException(status_code=404, detail="City not found or no matching location")
            city = candidates[0].get("name", city)
            response = fetch_forecast(city)
        else:
            raise HTTPException(status_code=404, detail="City not found")

    if response.status_code == 403:
        raise HTTPException(status_code=403, detail="Invalid API key or access forbidden")
    elif response.status_code == 401:
        raise HTTPException(status_code=401, detail="Unauthorized access to weather API")
    elif response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded, try again later")
    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail="City not found")
    elif response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Weather API error ({response.status_code}): {response.text[:128]}")

    data = response.json()
    current = data["current"]
    location = data["location"]

    current_weather = {
        "temperature": round(current["temp_c"], 1),
        "humidity": current["humidity"],
        "description": current["condition"]["text"],
        "wind_speed": round(current["wind_kph"] / 3.6, 1),
        "icon": "https:" + current["condition"]["icon"],
        "feels_like": round(current["feelslike_c"], 1),
        "uv_index": current["uv"],
        "pressure": current["pressure_mb"],
        "visibility": current["vis_km"],
        "city": location["name"],
        "country": location["country"],
        "local_time": location["localtime"]
    }

    forecast = []
    for day in data["forecast"]["forecastday"]:
        forecast.append({
            "date": day["date"],
            "max_temp": round(day["day"]["maxtemp_c"], 1),
            "min_temp": round(day["day"]["mintemp_c"], 1),
            "description": day["day"]["condition"]["text"],
            "icon": "https:" + day["day"]["condition"]["icon"],
            "humidity": day["day"]["avghumidity"],
            "wind_speed": round(day["day"]["maxwind_kph"] / 3.6, 1),
            "chance_of_rain": day["day"]["daily_chance_of_rain"]
        })

    result = {
        "current": current_weather,
        "forecast": forecast
    }

    weather_cache[city_key] = {"ts": now, "data": result}
    return result