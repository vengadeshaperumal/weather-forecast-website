# Pro Weather Dashboard

A professional-grade weather dashboard built with FastAPI and modern web technologies, featuring comprehensive weather data and stunning visual design.

## Features

- **Universal Location Search**: Accepts cities, countries, landmarks, and any geographic location
- **Current Weather**: Real-time temperature, humidity, wind speed, UV index, visibility, and more
- **3-Day Forecast**: Detailed weather predictions with icons, temperatures, and additional metrics
- **Dynamic Backgrounds**: Animated gradients that change based on temperature
- **Glassmorphism Design**: Modern UI with backdrop blur effects and transparent elements
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Professional Animations**: Smooth transitions, hover effects, and loading states
- **Comprehensive Data**: Feels-like temperature, pressure, chance of rain, and more

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Get an API key from [WeatherAPI](https://www.weatherapi.com/).

3. Add your API key to the `.env` file:
   ```
   API_KEY=your_actual_api_key_here
   ```

4. Run the app:
   ```
   uvicorn main:app --reload
   ```

5. Open your browser to `http://127.0.0.1:8000`

## Learning Focus

### Advanced API Integration
The app fetches both current weather and 3-day forecast data from WeatherAPI, demonstrating how to handle complex JSON responses and display multiple data sets.

### Modern CSS Techniques
- CSS Variables for consistent theming
- Backdrop-filter for glassmorphism effects
- CSS Grid and Flexbox for responsive layouts
- Advanced animations with cubic-bezier timing functions
- Dynamic background changes based on data

### Professional UI/UX
- Loading states and error handling
- Smooth animations and transitions
- Mobile-first responsive design
- Accessibility considerations with proper contrast and focus states