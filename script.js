document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const currentTemp = document.getElementById('current-temp');
    const weatherDescription = document.getElementById('weather-description');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const cloudCover = document.getElementById('cloud-cover');
    const forecastContainer = document.querySelector('.forecast-items');
    
    // API Key - Replace with your actual OpenWeatherMap API key
    const apiKey = 'YOUR_API_KEY_HERE';
    
    // Initialize with Colombo as default city
    fetchWeather('Colombo');
    
    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeather(location);
        }
    });
    
    currentLocationBtn.addEventListener('click', getCurrentLocationWeather);
    
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const location = locationInput.value.trim();
            if (location) {
                fetchWeather(location);
            }
        }
    });
    
    // Functions
    function fetchWeather(city) {
        // Current weather
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    displayCurrentWeather(data);
                    // Fetch forecast after current weather
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
                } else {
                    throw new Error(data.message);
                }
            })
            .then(response => response.json())
            .then(data => {
                displayForecast(data);
            })
            .catch(error => {
                alert('Error fetching weather data: ' + error.message);
                console.error('Error:', error);
            });
    }
    
    function displayCurrentWeather(data) {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        currentTemp.textContent = Math.round(data.main.temp);
        weatherDescription.textContent = data.weather[0].description;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        cloudCover.textContent = `${data.clouds.all}%`;
        
        // Update weather icon
        const weatherIcon = document.querySelector('.weather-icon i');
        const weatherCode = data.weather[0].id;
        weatherIcon.className = getWeatherIcon(weatherCode);
        
        // Update date
        const now = new Date();
        currentDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function displayForecast(data) {
        // Clear previous forecast
        forecastContainer.innerHTML = '';
        
        // Get forecast for next 5 days at 12:00 PM
        const dailyForecasts = [];
        for (let i = 0; i < data.list.length; i++) {
            const forecast = data.list[i];
            const forecastTime = new Date(forecast.dt * 1000).getHours();
            if (forecastTime === 12) {
                dailyForecasts.push(forecast);
                if (dailyForecasts.length === 5) break;
            }
        }
        
        // If we didn't get 12 PM forecasts, just take every 8th item (24h difference)
        if (dailyForecasts.length < 5) {
            for (let i = 0; i < data.list.length; i += 8) {
                if (dailyForecasts.length < 5) {
                    dailyForecasts.push(data.list[i]);
                } else {
                    break;
                }
            }
        }
        
        // Display forecast items
        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const weatherCode = forecast.weather[0].id;
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon">
                    <i class="${getWeatherIcon(weatherCode)}"></i>
                </div>
                <div class="forecast-temp">
                    <span class="max-temp">${Math.round(forecast.main.temp_max)}°</span>
                    <span class="min-temp">${Math.round(forecast.main.temp_min)}°</span>
                </div>
            `;
            forecastContainer.appendChild(forecastItem);
        });
    }
    
    function getWeatherIcon(weatherCode) {
        if (weatherCode >= 200 && weatherCode < 300) {
            return 'fas fa-bolt'; // Thunderstorm
        } else if (weatherCode >= 300 && weatherCode < 400) {
            return 'fas fa-cloud-rain'; // Drizzle
        } else if (weatherCode >= 500 && weatherCode < 600) {
            return 'fas fa-umbrella'; // Rain
        } else if (weatherCode >= 600 && weatherCode < 700) {
            return 'fas fa-snowflake'; // Snow
        } else if (weatherCode >= 700 && weatherCode < 800) {
            return 'fas fa-smog'; // Atmosphere (fog, haze, etc.)
        } else if (weatherCode === 800) {
            return 'fas fa-sun'; // Clear
        } else if (weatherCode > 800) {
            return 'fas fa-cloud'; // Clouds
        } else {
            return 'fas fa-question'; // Unknown
        }
    }
    
    function getCurrentLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // Fetch weather by coordinates
                    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.cod === 200) {
                                displayCurrentWeather(data);
                                locationInput.value = data.name;
                                // Fetch forecast
                                return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
                            } else {
                                throw new Error(data.message);
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            displayForecast(data);
                        })
                        .catch(error => {
                            alert('Error fetching weather data: ' + error.message);
                            console.error('Error:', error);
                        });
                },
                error => {
                    alert('Error getting location: ' + error.message);
                    console.error('Error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }
});

