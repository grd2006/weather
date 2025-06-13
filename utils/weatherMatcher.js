import cities from './cities.js';

export class WeatherMatcher {
    constructor() {
        this.cities = cities;
        this.weatherCache = new Map();
        this.lastUpdate = null;
        this.updateInterval = 3600000; // 1 hour in milliseconds
    }

    async fetchWeatherData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API responded with status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    async fetchAirQuality(lat, lon) {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Air quality API request failed');
            return await response.json();
        } catch (error) {
            console.error('Error fetching air quality data:', error);
            return null;
        }
    }

    shouldUpdateCache() {
        if (!this.lastUpdate) return true;
        return Date.now() - this.lastUpdate > this.updateInterval;
    }

    calculateWeatherDifference(target, city) {
        return Math.abs(target.temperature_2m - city.temperature_2m) +
               Math.abs(target.relative_humidity_2m - city.relative_humidity_2m) +
               Math.abs(target.wind_speed_10m - city.wind_speed_10m);
    }

    async findClosestMatch(targetWeather) {
        if (!targetWeather?.current) return null;

        let bestMatch = null;
        let smallestDiff = Infinity;

        for (const [continent, cityList] of Object.entries(this.cities)) {
            for (const city of cityList) {
                const cityWeather = await this.fetchWeatherData(city.lat, city.lon);
                if (!cityWeather?.current) continue;

                const diff = this.calculateWeatherDifference(
                    targetWeather.current,
                    cityWeather.current
                );

                if (diff < smallestDiff) {
                    smallestDiff = diff;
                    bestMatch = city.name;
                }
            }
        }

        return bestMatch;
    }

    async findClosestMatches(targetWeather, targetCity = null) {
        if (!targetWeather?.current) return null;

        try {
            let matches = [];
            const MAX_MATCHES = 5;

            for (const [continent, cityList] of Object.entries(this.cities)) {
                for (const city of cityList) {
                    // Skip the target city
                    if (targetCity && city.name.toLowerCase() === targetCity.toLowerCase()) {
                        continue;
                    }

                    const cityWeather = await this.fetchWeatherData(city.lat, city.lon);
                    if (!cityWeather?.current) continue;

                    const diff = this.calculateWeatherDifference(
                        targetWeather.current,
                        cityWeather.current
                    );

                    matches.push({
                        city: city.name,
                        difference: diff,
                        continent: continent
                    });
                }
            }

            return matches
                .sort((a, b) => a.difference - b.difference)
                .slice(0, MAX_MATCHES);
        } catch (error) {
            console.error('Error finding closest matches:', error);
            return null;
        }
    }

    async getCurrentWeather(lat, lon) {
        const weatherData = await this.fetchWeatherData(lat, lon);
        const airQuality = await this.fetchAirQuality(lat, lon);
        
        return {
            weather: weatherData,
            air_quality: airQuality
        };
    }

    // Separate method for similar cities
    async getSimilarCities(lat, lon, cityName = null) {
        const targetWeather = await this.fetchWeatherData(lat, lon);
        if (!targetWeather) return null;

        const matchingCities = await this.findClosestMatches(targetWeather, cityName);
        return { matching_cities: matchingCities };
    }
}