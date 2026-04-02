let tempChart = null;
let humidityWindChart = null;

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorTitle = errorMessage.querySelector('.error-text h3');
    const errorBody = errorMessage.querySelector('.error-text p');

    errorTitle.textContent = 'Unable to fetch weather';
    errorBody.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');
}

function updateCharts(forecast) {
    const labels = forecast.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }));
    const maxTemps = forecast.map(day => day.max_temp);
    const minTemps = forecast.map(day => day.min_temp);
    const humidityValues = forecast.map(day => day.humidity);
    const windValues = forecast.map(day => day.wind_speed);

    if (tempChart) tempChart.destroy();
    if (humidityWindChart) humidityWindChart.destroy();

    const tempCtx = document.getElementById('tempChart').getContext('2d');
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Max °C',
                    data: maxTemps,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Min °C',
                    data: minTemps,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            },
            scales: {
                x: { ticks: { color: '#ffffff' } },
                y: { ticks: { color: '#ffffff' } }
            }
        }
    });

    const humidityWindCtx = document.getElementById('humidityWindChart').getContext('2d');
    humidityWindChart = new Chart(humidityWindCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Humidity %',
                    data: humidityValues,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Wind m/s',
                    data: windValues,
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            },
            scales: {
                x: { ticks: { color: '#ffffff' } },
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { color: '#ffffff' },
                    title: { display: true, text: 'Humidity %', color: '#ffffff' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#ffffff' },
                    title: { display: true, text: 'Wind m/s', color: '#ffffff' }
                }
            }
        }
    });
}

document.getElementById('search-btn').addEventListener('click', function() {
    const city = document.getElementById('city-input').value.trim();
    if (!city) return;

    // Show loading state
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('weather-content').classList.add('hidden');
    hideError();
    document.getElementById('search-btn').innerHTML = '<span>⏳</span> Searching...';
    document.getElementById('search-btn').disabled = true;

    fetch(`/weather/${encodeURIComponent(city)}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) throw new Error('Invalid API key (403).');
                if (response.status === 401) throw new Error('Unauthorized (401).');
                if (response.status === 429) throw new Error('Rate limit exceeded (429). Please wait.');
                if (response.status === 404) throw new Error('City not found (404). Check spelling.');
                throw new Error(`Error ${response.status}: unable to retrieve data.`);
            }
            return response.json();
        })
        .then(data => {
            const current = data.current;
            const forecast = data.forecast;

            document.getElementById('city-name').textContent = current.city;
            document.getElementById('country-name').textContent = current.country;
            document.getElementById('local-time').textContent = new Date(current.local_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('weather-icon').src = current.icon;
            document.getElementById('temperature').textContent = `${current.temperature}°C`;
            document.getElementById('feels-like').textContent = `${current.feels_like}°C`;
            document.getElementById('description').textContent = current.description;
            document.getElementById('humidity').textContent = `${current.humidity}%`;
            document.getElementById('wind-speed').textContent = `${current.wind_speed} m/s`;
            document.getElementById('uv-index').textContent = current.uv_index;
            document.getElementById('visibility').textContent = `${current.visibility} km`;

            const forecastContainer = document.getElementById('forecast-container');
            forecastContainer.innerHTML = '';

            forecast.forEach(day => {
                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-date">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <img src="${day.icon}" alt="Weather icon" class="forecast-icon">
                    <div class="forecast-temps">
                        <span class="forecast-max">${day.max_temp}°</span>
                        <span class="forecast-min">${day.min_temp}°</span>
                    </div>
                    <div class="forecast-desc">${day.description}</div>
                    <div class="forecast-details">
                        <div class="forecast-detail"><i class="fas fa-tint"></i><span>${day.humidity}%</span></div>
                        <div class="forecast-detail"><i class="fas fa-wind"></i><span>${day.wind_speed} m/s</span></div>
                        <div class="forecast-detail"><i class="fas fa-cloud-rain"></i><span>${day.chance_of_rain}%</span></div>
                    </div>
                `;
                forecastContainer.appendChild(card);
            });

            // No temperature-based body color change needed.
            document.body.className = '';

            updateCharts(forecast);

            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('weather-content').classList.remove('hidden');
        })
        .catch(error => {
            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('weather-content').classList.add('hidden');
            showError(error.message);
        })
        .finally(() => {
            document.getElementById('search-btn').innerHTML = '<span>🔍</span> Get Weather';
            document.getElementById('search-btn').disabled = false;
        });
});