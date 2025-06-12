"use client";

import { useState, useEffect } from "react";
import ReactAnimatedWeather from 'react-animated-weather';

const apiKey = "b45XMR19ZwJJhv0jMcLyXhzMmJd4r4Z5"; // Replace with your actual API key

// Helper function to map moon phase value (0-1) to a description
const getMoonPhaseDescription = (moonPhase) => {
    if (moonPhase === null || moonPhase === undefined) return 'N/A';
    if (moonPhase === 0 || moonPhase === 1) return 'New Moon';
    if (moonPhase > 0 && moonPhase < 0.25) return 'Waxing Crescent';
    if (moonPhase === 0.25) return 'First Quarter';
    if (moonPhase > 0.25 && moonPhase < 0.5) return 'Waxing Gibbous';
    if (moonPhase === 0.5) return 'Full Moon';
    if (moonPhase > 0.5 && moonPhase < 0.75) return 'Waning Gibbous';
    if (moonPhase === 0.75) return 'Last Quarter';
    if (moonPhase > 0.75 && moonPhase < 1) return 'Waning Crescent';
    return 'Unknown';
};

// Helper to format time from Unix timestamp
const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Helper to map Pirate Weather icons to react-animated-weather icons
const mapPirateWeatherIconToAnimated = (icon) => {
    if (!icon) return 'CLEAR_DAY';
    switch (icon) {
        case 'clear-day': return 'CLEAR_DAY';
        case 'clear-night': return 'CLEAR_NIGHT';
        case 'rain': return 'RAIN';
        case 'snow': return 'SNOW';
        case 'sleet': return 'SLEET';
        case 'wind': return 'WIND';
        case 'fog': return 'FOG';
        case 'cloudy': return 'CLOUDY';
        case 'partly-cloudy-day': return 'PARTLY_CLOUDY_DAY';
        case 'partly-cloudy-night': return 'PARTLY_CLOUDY_NIGHT';
        default: return 'CLEAR_DAY';
    }
};

// Floating particles component
const FloatingParticles = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    );
};

// Loading spinner component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200/30 border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-purple-500 animate-spin animate-reverse" style={{ animationDuration: '1.5s' }}></div>
        </div>
    </div>
);

export default function Home() {
    const [inputLat, setInputLat] = useState('');
    const [inputLon, setInputLon] = useState('');
    const [cityInput, setCityInput] = useState('');
    const [locationName, setLocationName] = useState(null);
    const [currentSummary, setCurrentSummary] = useState(null);
    const [currentIcon, setCurrentIcon] = useState(null);
    const [currentTemperature, setCurrentTemperature] = useState(null);
    const [apparentTemperature, setApparentTemperature] = useState(null);
    const [highTemp, setHighTemp] = useState(null);
    const [lowTemp, setLowTemp] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [pressure, setPressure] = useState(null);
    const [visibility, setVisibility] = useState(null);
    const [windSpeed, setWindSpeed] = useState(null);
    const [dewPoint, setDewPoint] = useState(null);
    const [uvIndex, setUvIndex] = useState(null);
    const [sunriseTime, setSunriseTime] = useState(null);
    const [sunsetTime, setSunsetTime] = useState(null);
    const [moonPhase, setMoonPhase] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showWeatherCard, setShowWeatherCard] = useState(false);

    // Add time-based background gradient
    const [currentHour, setCurrentHour] = useState(new Date().getHours());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHour(new Date().getHours());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Dynamic background based on time
    const getTimeBasedGradient = () => {
        if (currentHour >= 5 && currentHour < 12) {
            return "from-amber-200 via-orange-200 to-yellow-300"; // Morning
        } else if (currentHour >= 12 && currentHour < 17) {
            return "from-blue-300 via-sky-200 to-cyan-300"; // Afternoon
        } else if (currentHour >= 17 && currentHour < 20) {
            return "from-orange-300 via-red-200 to-pink-300"; // Evening
        } else {
            return "from-indigo-400 via-purple-300 to-blue-400"; // Night
        }
    };

    const clearWeatherData = () => {
        setLocationName(null);
        setCurrentSummary(null);
        setCurrentIcon(null);
        setCurrentTemperature(null);
        setApparentTemperature(null);
        setHighTemp(null);
        setLowTemp(null);
        setHumidity(null);
        setPressure(null);
        setVisibility(null);
        setWindSpeed(null);
        setDewPoint(null);
        setUvIndex(null);
        setSunriseTime(null);
        setSunsetTime(null);
        setMoonPhase(null);
        setShowWeatherCard(false);
    };

    const fetchWeatherApi = async (lat, lon, locationDisplayName = null) => {
        if (!lat || !lon) {
            setError('Latitude and longitude are required to fetch weather.');
            clearWeatherData();
            setLoading(false);
            return;
        }

        clearWeatherData();
        setError(null);

        try {
            // Mock data for demonstration since we don't have a real API key
            const mockData = {
                currently: {
                    summary: "Partly Cloudy",
                    icon: "partly-cloudy-day",
                    temperature: 72,
                    apparentTemperature: 75,
                    humidity: 0.65,
                    pressure: 1013.2,
                    visibility: 10,
                    windSpeed: 8.5,
                    dewPoint: 58,
                    uvIndex: 4
                },
                daily: {
                    data: [{
                        temperatureHigh: 78,
                        temperatureLow: 65,
                        sunriseTime: Math.floor(Date.now() / 1000) - 3600,
                        sunsetTime: Math.floor(Date.now() / 1000) + 7200,
                        moonPhase: 0.25
                    }]
                }
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const data = mockData;

            setCurrentSummary(data?.currently?.summary || 'N/A');
            setCurrentIcon(data?.currently?.icon || null);
            setCurrentTemperature(data?.currently?.temperature);
            setApparentTemperature(data?.currently?.apparentTemperature);
            setHumidity(data?.currently?.humidity);
            setPressure(data?.currently?.pressure);
            setVisibility(data?.currently?.visibility);
            setWindSpeed(data?.currently?.windSpeed);
            setDewPoint(data?.currently?.dewPoint);
            setUvIndex(data?.currently?.uvIndex);

            const today = data?.daily?.data?.[0];
            setHighTemp(today?.temperatureHigh);
            setLowTemp(today?.temperatureLow);
            setSunriseTime(today?.sunriseTime);
            setSunsetTime(today?.sunsetTime);
            setMoonPhase(today?.moonPhase);

            setLocationName(locationDisplayName || `${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}`);
            
            // Trigger card animation
            setTimeout(() => setShowWeatherCard(true), 100);

        } catch (err) {
            console.error("Fetch error:", err);
            setError(`Failed to fetch weather data: ${err.message}`);
            clearWeatherData();
        } finally {
            setLoading(false);
        }
    };

    const fetchWeatherFromInput = () => {
        if (!inputLat || !inputLon) {
            setError('Please enter both latitude and longitude.');
            clearWeatherData();
            return;
        }
        if (isNaN(parseFloat(inputLat)) || isNaN(parseFloat(inputLon))) {
            setError('Please enter valid numerical latitude and longitude.');
            clearWeatherData();
            return;
        }
        clearWeatherData();
        setError(null);
        setLoading(true);
        fetchWeatherApi(inputLat, inputLon);
    };

    const fetchWeatherByLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            clearWeatherData();
            return;
        }

        clearWeatherData();
        setError(null);
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                setInputLat(lat.toString());
                setInputLon(lon.toString());
                fetchWeatherApi(lat, lon, 'Your Current Location');
            },
            (error) => {
                setLoading(false);
                clearWeatherData();
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError("Permission to access location was denied. Please enable location permissions in your browser settings.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        setError("The request to get user location timed out.");
                        break;
                    default:
                        setError(`An unknown error occurred getting your location: ${error.message}`);
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const fetchWeatherByCity = async () => {
        if (!cityInput.trim()) {
            setError('Please enter a city name.');
            clearWeatherData();
            return;
        }

        clearWeatherData();
        setError(null);
        setLoading(true);

        try {
            // Mock coordinates for demo
            const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
            const lon = -74.0060 + (Math.random() - 0.5) * 0.1;
            setInputLat(lat.toString());
            setInputLon(lon.toString());
            fetchWeatherApi(lat, lon, cityInput);
        } catch (err) {
            console.error("Geocoding error:", err);
            setError(`Failed to get coordinates for city: ${err.message}`);
            clearWeatherData();
            setLoading(false);
        }
    };

    const showWeatherData = apparentTemperature !== null && apparentTemperature !== undefined;
    const showInitialMessage = !loading && !error && !showWeatherData;

    return (
        <div className={`relative flex flex-col items-center w-screen min-h-screen bg-gradient-to-br ${getTimeBasedGradient()} text-gray-800 p-4 overflow-y-auto transition-all duration-1000 ease-in-out}`}>
            <FloatingParticles />
            
            {/* Animated header */}
            <div className="relative z-10 text-center mb-8">
                <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                    ☀ Weather Forecast ⛅
                </h1>
                <p className="text-lg text-gray-700 opacity-80">Discover the weather in style</p>
            </div>

            {/* Enhanced input sections with glassmorphism */}
            <div className="relative z-10 w-full max-w-4xl space-y-6">
                {/* Coordinates Input */}
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-6 shadow-xl border border-white/30 hover:bg-white/25 transition-all duration-300 transform hover:scale-[1.02]">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                        🌍 Enter Coordinates
                    </h3>
                    <div className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Latitude:</label>
                            <input
                                type="text"
                                value={inputLat}
                                onChange={(e) => setInputLat(e.target.value)}
                                placeholder="e.g., 23.2599"
                                className="w-full p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/70 transition-all duration-300 placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Longitude:</label>
                            <input
                                type="text"
                                value={inputLon}
                                onChange={(e) => setInputLon(e.target.value)}
                                placeholder="e.g., 77.4126"
                                className="w-full p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/70 transition-all duration-300 placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={fetchWeatherFromInput}
                            disabled={loading || !inputLat || !inputLon}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center space-x-2"
                        >
                            <span>🔍 Get Weather</span>
                        </button>
                    </div>
                </div>

                {/* City Input */}
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-6 shadow-xl border border-white/30 hover:bg-white/25 transition-all duration-300 transform hover:scale-[1.02]">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                        🏙 Search by City
                    </h3>
                    <div className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2 text-gray-700">City Name:</label>
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                placeholder="e.g., New York, London, Tokyo"
                                className="w-full p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/70 transition-all duration-300 placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={fetchWeatherByCity}
                            disabled={loading || !cityInput.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center space-x-2"
                        >
                            <span>🌆 Search City</span>
                        </button>
                    </div>
                </div>

                {/* Location Button */}
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-6 shadow-xl border border-white/30 hover:bg-white/25 transition-all duration-300 transform hover:scale-[1.02]">
                    <button
                        onClick={fetchWeatherByLocation}
                        disabled={loading}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <span>📍 Use My Current Location</span>
                    </button>
                </div>
            </div>

            {/* Status Messages */}
            <div className="relative z-10 w-full max-w-4xl mt-6">
                {error && (
                    <div className="backdrop-blur-md bg-red-500/20 border border-red-300/30 rounded-2xl p-4 text-center animate-pulse">
                        <p className="text-red-800 font-medium">❌ {error}</p>
                    </div>
                )}

                {loading && !error && (
                    <div className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 rounded-2xl p-6 text-center">
                        <LoadingSpinner />
                        <p className="text-blue-800 font-medium mt-4">✨ Fetching magical weather data...</p>
                    </div>
                )}

                {showInitialMessage && (
                    <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-6 text-center animate-bounce">
                        <p className="text-gray-700 font-medium">🌈 Choose your preferred way to get weather information!</p>
                    </div>
                )}
            </div>

            {/* Enhanced Weather Card */}
            {!loading && !error && showWeatherData && (
                <div className={`relative z-10 w-full max-w-4xl mt-8 transition-all duration-1000 transform ${showWeatherCard ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
                    <div className="backdrop-blur-lg bg-gradient-to-br from-white/30 to-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                                {locationName ? `Weather in ${locationName}` : 'Weather Data'}
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto"></div>
                        </div>

                        {/* Main Weather Display */}
                        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 space-y-6 lg:space-y-0">
                            {/* Left: Icon and Temperature */}
                            <div className="flex items-center space-x-6">
                                {currentIcon && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                        <ReactAnimatedWeather
                                            icon={mapPirateWeatherIconToAnimated(currentIcon)}
                                            color="#f59e0b"
                                            size={80}
                                            animate={true}
                                        />
                                    </div>
                                )}

                                <div className="text-center lg:text-left">
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-6xl font-bold text-gray-800">
                                            {apparentTemperature !== null ? Math.round(apparentTemperature) : 'N/A'}
                                        </span>
                                        <span className="text-2xl text-gray-600">°F</span>
                                    </div>
                                    <div className="flex items-baseline space-x-2 mt-1">
                                        <span className="text-4xl font-semibold text-gray-700">
                                            {apparentTemperature !== null ? Math.round((apparentTemperature - 32) * 5 / 9) : 'N/A'}
                                        </span>
                                        <span className="text-xl text-gray-600">°C</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Feels Like</p>
                                    {currentTemperature !== null && (
                                        <p className="text-sm text-gray-600">Actual: {Math.round(currentTemperature)}°F</p>
                                    )}
                                    {currentSummary && currentSummary !== 'N/A' && (
                                        <p className="text-lg italic text-gray-700 mt-2 font-medium">{currentSummary}</p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Sun/Moon Info */}
                            <div className="backdrop-blur-sm bg-white/20 rounded-2xl p-6 space-y-3">
                                {sunriseTime && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">🌅</span>
                                        <div>
                                            <p className="text-sm text-gray-600">Sunrise</p>
                                            <p className="font-semibold text-gray-800">{formatTime(sunriseTime)}</p>
                                        </div>
                                    </div>
                                )}
                                {sunsetTime && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">🌇</span>
                                        <div>
                                            <p className="text-sm text-gray-600">Sunset</p>
                                            <p className="font-semibold text-gray-800">{formatTime(sunsetTime)}</p>
                                        </div>
                                    </div>
                                )}
                                {moonPhase !== null && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">🌙</span>
                                        <div>
                                            <p className="text-sm text-gray-600">Moon Phase</p>
                                            <p className="font-semibold text-gray-800">{getMoonPhaseDescription(moonPhase)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weather Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* High/Low */}
                            {((highTemp !== null && highTemp !== undefined) || (lowTemp !== null && lowTemp !== undefined)) && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">🌡</span>
                                    <p className="text-xs text-gray-600 mb-1">High/Low</p>
                                    <p className="font-bold text-gray-800">
                                        {highTemp !== null ? Math.round(highTemp) + '°' : 'N/A'} / {lowTemp !== null ? Math.round(lowTemp) + '°' : 'N/A'}
                                    </p>
                                </div>
                            )}

                            {/* Wind */}
                            {windSpeed !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">💨</span>
                                    <p className="text-xs text-gray-600 mb-1">Wind Speed</p>
                                    <p className="font-bold text-gray-800">{Math.round(windSpeed)} mph</p>
                                </div>
                            )}

                            {/* Humidity */}
                            {humidity !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">💧</span>
                                    <p className="text-xs text-gray-600 mb-1">Humidity</p>
                                    <p className="font-bold text-gray-800">{Math.round(humidity * 100)}%</p>
                                </div>
                            )}

                            {/* UV Index */}
                            {uvIndex !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">☀</span>
                                    <p className="text-xs text-gray-600 mb-1">UV Index</p>
                                    <p className="font-bold text-gray-800">
                                        {uvIndex >= 8 ? 'Very High' : uvIndex >= 6 ? 'High' : uvIndex >= 3 ? 'Moderate' : 'Low'} ({uvIndex})
                                    </p>
                                </div>
                            )}

                            {/* Pressure */}
                            {pressure !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">📊</span>
                                    <p className="text-xs text-gray-600 mb-1">Pressure</p>
                                    <p className="font-bold text-gray-800">{pressure.toFixed(1)} mb</p>
                                </div>
                            )}

                            {/* Visibility */}
                            {visibility !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">👁</span>
                                    <p className="text-xs text-gray-600 mb-1">Visibility</p>
                                    <p className="font-bold text-gray-800">{visibility.toFixed(1)} mi</p>
                                </div>
                            )}

                            {/* Dew Point */}
                            {dewPoint !== null && (
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                                    <span className="text-2xl mb-2 block">🌊</span>
                                    <p className="text-xs text-gray-600 mb-1">Dew Point</p>
                                    <p className="font-bold text-gray-800">{Math.round(dewPoint)}°F</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}