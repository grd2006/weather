"use client";

import { useState } from "react";
// Import the main component from react-animated-weather
import ReactAnimatedWeather from 'react-animated-weather';

//Tetris Loading Animation
import dynamic from 'next/dynamic';
import weatherAnimation from '../public/animations/your-animation-file.json';
const Animation = dynamic(() => import('./components/Animation'), { ssr: false });

const apiKey = process.env.NEXT_PUBLIC_PIRATEWEATHER_API_KEY;



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
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Helper to map Pirate Weather icons to react-animated-weather icons
const mapPirateWeatherIconToAnimated = (icon) => {
    if (!icon) return 'CLEAR_DAY'; // Default icon if none provided

    // Convert Pirate Weather icon string (lowercase, hyphenated)
    // to react-animated-weather icon string (uppercase, underscored)
    switch (icon) {
        case 'clear-day': return 'CLEAR_DAY';
        case 'clear-night': return 'CLEAR_NIGHT';
        case 'rain': return 'RAIN';
        case 'snow': return 'SNOW';
        case 'sleet': return 'SLEET'; // react-animated-weather has SLEET
        case 'wind': return 'WIND';   // react-animated-weather has WIND
        case 'fog': return 'FOG';
        case 'cloudy': return 'CLOUDY';
        case 'partly-cloudy-day': return 'PARTLY_CLOUDY_DAY';
        case 'partly-cloudy-night': return 'PARTLY_CLOUDY_NIGHT';
        // Pirate Weather has 'hail', 'thunderstorm', 'tornado' - animated-weather doesn't
        default: return 'CLEAR_DAY'; // Fallback for unhandled icons
    }
};


export default function Home() {
  // State to hold user input for latitude and longitude
  const [inputLat, setInputLat] = useState('');
  const [inputLon, setInputLon] = useState('');

  // State to hold user input for city name
  const [cityInput, setCityInput] = useState('');

  // State to hold the location name for the card header
  const [locationName, setLocationName] = useState(null);


  // State to hold ALL the specific fetched weather data pieces for the card
  const [currentSummary, setCurrentSummary] = useState(null); // 'currently.summary'
  const [currentIcon, setCurrentIcon] = useState(null); // 'currently.icon' (for react-animated-weather)
  const [currentTemperature, setCurrentTemperature] = useState(null); // 'currently.temperature' (Actual)
  const [apparentTemperature, setApparentTemperature] = useState(null); // 'currently.apparentTemperature' (Feels Like)
  const [highTemp, setHighTemp] = useState(null); // 'daily.data[0].temperatureHigh'
  const [lowTemp, setLowTemp] = useState(null);  // 'daily.data[0].temperatureLow'
  const [humidity, setHumidity] = useState(null); // 'currently.humidity' (0-1)
  const [pressure, setPressure] = useState(null); // 'currently.pressure'
  const [visibility, setVisibility] = useState(null); // 'currently.visibility'
  const [windSpeed, setWindSpeed] = useState(null); // 'currently.windSpeed'
  const [dewPoint, setDewPoint] = useState(null); // 'currently.dewPoint'
  const [uvIndex, setUvIndex] = useState(null); // 'currently.uvIndex'
  const [sunriseTime, setSunriseTime] = useState(null); // 'daily.data[0].sunriseTime' (Unix timestamp)
  const [sunsetTime, setSunsetTime] = useState(null); // 'daily.data[0].sunsetTime' (Unix timestamp)
  const [moonPhase, setMoonPhase] = useState(null); // 'daily.data[0].moonPhase' (0-1)

  // State to hold the matching city name
  const [matchingCities, setMatchingCities] = useState([]);


  // State to manage loading status for any async operation (weather, geo, geocode)
  const [loading, setLoading] = useState(false);

  // State to manage potential errors from any operation
  const [error, setError] = useState(null);

  // Add loading state for weather
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);


  // Helper function to reset all weather data states
  const clearWeatherData = () => {
    setLocationName(null);
    setCurrentSummary(null);
    setCurrentIcon(null); // Clear the icon state too
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
    setMatchingCities([]);
  }


  // Helper function to perform the actual weather API fetch
  // Takes lat and lon and an optional display name for the location
  const fetchWeatherApi = async (lat, lon, locationDisplayName = null) => {
    if (!lat || !lon) {
        setError('Latitude and longitude are required to fetch weather.');
        clearWeatherData();
        setLoading(false);
        return;
    }

    // Reset states before fetching (clear previous data and errors). Loading is set before calling this helper.
    clearWeatherData();
    setError(null);
    // setLoading(true); // Loading is handled by the calling function


    try {
      // Construct the Pirate Weather URL
      // You can add '&units=si' here to get metric units (Celsius, km/h, m, etc.)
      const url = `https://api.pirateweather.net/forecast/${apiKey}/${lat},${lon}`;
      const res = await fetch(url);

      if (!res.ok) {
         const errorBody = await res.text();
         throw new Error(`HTTP error! status: ${res.status}, message: ${errorBody || res.statusText}`);
      }

      const data = await res.json();

      // --- EXTRACT ALL THE DATA FOR THE CARD HERE ---
      // Use optional chaining ?. for safety as some fields might be missing
      setCurrentSummary(data?.currently?.summary || 'N/A');
      setCurrentIcon(data?.currently?.icon || null); // Extract the icon string
      // Pirate Weather's default unit is Imperial (°F, mph, miles, mb)
      setCurrentTemperature(data?.currently?.temperature); // Actual Temp
      setApparentTemperature(data?.currently?.apparentTemperature); // Feels Like Temp
      setHumidity(data?.currently?.humidity); // Value is 0-1
      setPressure(data?.currently?.pressure); // Value in millibars (mb)
      setVisibility(data?.currently?.visibility); // Value in miles (mi)
      setWindSpeed(data?.currently?.windSpeed); // Value in miles per hour (mph)
      setDewPoint(data?.currently?.dewPoint); // Value in °F
      setUvIndex(data?.currently?.uvIndex);

      // Data from the 'daily' forecast, specifically the first day (today)
      const today = data?.daily?.data?.[0];
      setHighTemp(today?.temperatureHigh); // °F
      setLowTemp(today?.temperatureLow);  // °F
      setSunriseTime(today?.sunriseTime); // Unix timestamp in seconds
      setSunsetTime(today?.sunsetTime); // Unix timestamp in seconds
      setMoonPhase(today?.moonPhase); // Value 0-1

      // Set the location name for the card header
      setLocationName(locationDisplayName || `${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}`); // Default to formatted coords if no name

      // Fetch the matching city name based on coordinates
      await fetchMatchingCity(lat, lon);


    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to fetch weather data: ${err.message}`);
      clearWeatherData(); // Clear specific weather data on error
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  // Function to fetch weather data based on current INPUT state
  const fetchWeatherFromInput = () => {
    // Validation for input fields
    if (!inputLat || !inputLon) {
      setError('Please enter both latitude and longitude.');
      clearWeatherData();
      return;
    }
     // Basic validation for number format
     if (isNaN(parseFloat(inputLat)) || isNaN(parseFloat(inputLon))) {
        setError('Please enter valid numerical latitude and longitude.');
        clearWeatherData();
        return;
     }
    // Reset states before fetching
    clearWeatherData();
    setError(null);
    setLoading(true);
    // Use the helper function with input values (no display name here, fetchWeatherApi will use coords)
    fetchWeatherApi(inputLat, inputLon);
  };

  // Update the form submit handler
  const handleSubmit = async (e) => {
      e.preventDefault();
      await fetchWeatherFromInput();
  };

  // Function to trigger geolocation and fetch weather based on location
  const fetchWeatherByLocation = async () => {
    if ("geolocation" in navigator) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            setInputLat(latitude.toString());
            setInputLon(longitude.toString());
            
            // Only fetch current weather
            await fetchCurrentWeather(latitude, longitude);
            
        } catch (error) {
            console.error("Error getting location:", error);
            alert("Could not get your location. Please check your browser settings.");
        }
    } else {
        alert("Geolocation is not supported by your browser");
    }
};

// Separate weather fetch function
const fetchCurrentWeather = async (lat, lon) => {
    setIsLoadingWeather(true);
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.current) {
            setCurrentTemperature(data.current.temperature_2m);
            setHumidity(data.current.relative_humidity_2m);
            setWindSpeed(data.current.wind_speed_10m);
            // Set other weather states...
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
    } finally {
        setIsLoadingWeather(false);
    }
};

// Update form submit handler
const handleWeatherSearch = async (e) => {
    e.preventDefault();
    if (!inputLat || !inputLon) return;
    
    await fetchCurrentWeather(parseFloat(inputLat), parseFloat(inputLon));
};

// Add a separate button for finding similar cities
const handleFindSimilarCities = async () => {
    if (!inputLat || !inputLon) return;
    
    try {
        const response = await fetch(
            `/api/weather-match?lat=${inputLat}&lon=${inputLon}&city=${cityInput}`
        );
        const data = await response.json();

        if (data.matching_cities) {
            setMatchingCities(data.matching_cities);
        }
    } catch (error) {
        console.error('Error finding similar cities:', error);
    }
};


// Function to fetch coordinates by city name and then fetch weather
const fetchWeatherByCity = async () => {
    if (!cityInput.trim()) {
      setError('Please enter a city name.');
      clearWeatherData();
      return;
    }

    // Reset states before fetching
    clearWeatherData();
    setError(null);
    setLoading(true); // Use main loading state

    try {
        // Construct Nominatim URL - remember to encode the city name!
        // Also, Nominatim policy requires a User-Agent header.
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput.trim())}&format=json&limit=1&addressdetails=1`; // limit=1 gets only the top result, addressdetails=1 gives more info

        const res = await fetch(nominatimUrl, {
            headers: {
                // IMPORTANT: Replace with your app name and contact info
                // See Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
                'User-Agent': 'MyAwesomeWeatherApp / 1.0 (contact: your_email@example.com)'
            }
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorBody || res.statusText}`);
        }

        const data = await res.json();

        // Nominatim returns an array of results. Check if any were found.
        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            const displayName = data[0].display_name; // Use the display name from Nominatim

            // Optional: Update the input fields so the user sees the coordinates found
            setInputLat(lat);
            setInputLon(lon);

            // Now use the obtained lat/lon to fetch weather via the helper function
            // Pass the display name from Nominatim
            // fetchWeatherApi handles setting loading:false in its finally
            fetchWeatherApi(lat, lon, displayName);

        } else {
            // No results found for the city name
            setError(`No coordinates found for city: "${cityInput}". Please try a different name.`);
            clearWeatherData(); // Clear previous weather data
            setLoading(false); // Stop loading as no weather fetch will happen
        }

    } catch (err) {
        console.error("Geocoding error:", err);
        setError(`Failed to get coordinates for city: ${err.message}`);
        clearWeatherData(); // Clear previous weather data
        setLoading(false); // Stop loading on error
    }
    // Note: setLoading(false) is handled either inside the successful path (by fetchWeatherApi)
    // or in the catch/no-results blocks of this function.
  };


  // Function to fetch the matching city name based on coordinates
  const fetchMatchingCity = async (lat, lon) => {
    try {
        const response = await fetch(`/api/weather-match?lat=${lat}&lon=${lon}&city=${cityInput}`);
        const data = await response.json();
        if (data.matching_cities) {
            setMatchingCities(data.matching_cities);
        }
    } catch (error) {
        console.error('Error fetching matching cities:', error);
    }
  };

  // Separate the matching cities fetch from the main weather fetch
  const fetchSimilarCities = async () => {
    if (!inputLat || !inputLon) {
        alert('Please fetch weather data first');
        return;
    }

    setIsLoadingSimilar(true);
    try {
        const response = await fetch(
            `/api/weather-match?lat=${inputLat}&lon=${inputLon}&city=${cityInput}`
        );
        const data = await response.json();
        if (data.matching_cities) {
            setMatchingCities(data.matching_cities);
        }
    } catch (error) {
        console.error('Error fetching similar cities:', error);
    } finally {
        setIsLoadingSimilar(false);
    }
  };

  // Determine if weather data should be shown (check if apparent temperature is available as a key indicator)
  const showWeatherData = apparentTemperature !== null && apparentTemperature !== undefined;

  // Determine if the initial message should be shown
   const showInitialMessage = !loading && !error && !showWeatherData;



  return (
    <div className="flex flex-col items-center w-screen min-h-screen bg-gradient-to-br from-cyan-300 via-white to-cyan-400 text-gray-800 p-4 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Weather Forecast</h1>

      {/* Input fields and button for Coordinates */}
      <div className="flex flex-col sm:flex-row items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-3xl">
        <div className="flex-1 w-full">
           <label htmlFor="latitude" className="block text-sm font-medium mb-1 text-gray-800">Latitude:</label>
           <input
             id="latitude"
             type="text"
             value={inputLat}
             onChange={(e) => setInputLat(e.target.value)}
             placeholder="e.g., 23.2599"
             className="p-2 rounded text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
             disabled={loading} // Disable inputs while loading
           />
        </div>
        <div className="flex-1 w-full">
           <label htmlFor="longitude" className="block text-sm font-medium mb-1 text-gray-800">Longitude:</label>
           <input
             id="longitude"
             type="text"
             value={inputLon}
             onChange={(e) => setInputLon(e.target.value)}
             placeholder="e.g., 77.4126"
             className="p-2 rounded text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
             disabled={loading} // Disable inputs while loading
           />
        </div>
        {/* Button to fetch by input */}
        <button
          onClick={fetchWeatherFromInput}
          disabled={loading || !inputLat || !inputLon} // Disable while loading or inputs are empty
          className="w-full sm:w-auto mt-auto bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Get Weather
        </button>
      </div>

       {/* Input field and button for City */}
       <div className="flex flex-col sm:flex-row items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md">
           <div className="flex-1 w-full">
              <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-800">City Name:</label>
              <input
                id="city"
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="e.g., New York"
                className="p-2 rounded text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                disabled={loading} // Disable inputs while loading
              />
           </div>
           {/* Button to fetch by City */}
           <button
               onClick={fetchWeatherByCity}
               disabled={loading || !cityInput.trim()} // Disable while loading or city input is empty
               className="w-full sm:w-auto mt-auto bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
           >
               {loading && cityInput.trim() && !error ? 'Searching City...' : 'Get Weather by City'}
           </button>
       </div>

        {/* Button to fetch by Location */}
       <div className="w-full max-w-md mb-6">
            <button
                onClick={fetchWeatherByLocation}
                disabled={loading} // Disable while any loading is happening
                className="w-full bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {loading && navigator.geolocation && !error ? 'Getting Location...' : 'Get Weather by My Location'}
            </button>
       </div>


      {/* Display area */}
      <div className="w-full max-w-3xl mt-4">
        {error && (
          <p className="text-red-300 text-center">{error}</p>
        )}

        {loading && !error && ( // Only show loading if there's no current error message
            <><p className="text-center text-blue-200">
                      Fetching weather data...
                  </p><div className="w-72 h-72 mx-auto mb-8">
                          <Animation
                              animationData={weatherAnimation}
                              className="w-full h-full" />
                      </div></>
            
        )}

        {showInitialMessage && (
           <p className="text-center text-gray-800">
               Enter coordinates, a city name, or click 'Get Weather by My Location'.
            </p>
        )}

        {/* Display the weather card */}
        {!loading && !error && showWeatherData && (
          // Added background and styling similar to the image
          <div className="bg-transparent rounded-lg p-6 text-gray-800 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out">
            {/* Card Header */}
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
                {locationName ? `Weather Today in ${locationName}` : 'Weather Data'}
            </h2>

            {/* Main Display Section (Feels Like + Summary + Sunrise/Sunset + ICON) */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-6">
                {/* Left side: Icon, Feels Like, Actual Temp, Summary */}
                <div className="flex items-center mb-4 sm:mb-0">
                   {/* Display the main weather icon */}
                   {currentIcon && (
                       <div className="mr-4">
                           <ReactAnimatedWeather
                               icon={mapPirateWeatherIconToAnimated(currentIcon)}
                               color="#f59e0b" // Example color (orange-500)
                               size={60} // Adjust size as needed
                               animate={true}
                           />
                       </div>
                   )}

                   {/* Temperature and Summary */}
                   <div>
                       {/* Feels Like */}
                       <div className="text-6xl font-semibold">
                           {/* Round apparent temperature */}
                           {apparentTemperature !== null && apparentTemperature !== undefined ? Math.round(apparentTemperature) : 'N/A'}°F
                       </div>
                       <div className="text-6xl font-semibold">
                           {/* Round apparent temperature */}
                           {apparentTemperature !== null && apparentTemperature !== undefined 
  ? Math.round((apparentTemperature - 32) * 5 / 9) 
  : 'N/A'}°C

                       </div>
                       <p className="text-sm text-gray-800">Feels Like</p>
                        {/* Display actual temperature too */}
                        {currentTemperature !== null && currentTemperature !== undefined && (
                             <p className="text-sm text-gray-800 mt-1">Actual: {Math.round(currentTemperature)}°</p>
                        )}
                        {/* Display Summary */}
                        {currentSummary && currentSummary !== 'N/A' && ( // Don't show "Summary: N/A" if summary is N/A
                            <p className="text-sm text-gray-800 mt-1 italic">{currentSummary}</p>
                        )}
                   </div>
                </div>

                {/* Right side: Sunrise/Sunset */}
                <div className="flex flex-col items-center text-sm text-gray-800">
                    {/* Sunrise */}
                    {sunriseTime && (
                       <div className="flex items-center mb-2">
                           {/* No icon from react-animated-weather, just text */}
                           Sunrise: <span className="ml-1 font-medium">{formatTime(sunriseTime)}</span>
                       </div>
                    )}
                     {/* Sunset */}
                     {sunsetTime && (
                        <div className="flex items-center">
                           {/* No icon from react-animated-weather, just text */}
                           Sunset: <span className="ml-1 font-medium">{formatTime(sunsetTime)}</span>
                        </div>
                     )}
                     {!sunriseTime && !sunsetTime && <p>Times N/A</p>}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-800">
              {/* High/Low Temp */}
              {(highTemp !== null && highTemp !== undefined) || (lowTemp !== null && lowTemp !== undefined) ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    High/Low: <span className="ml-2 font-medium">
                        {highTemp !== null && highTemp !== undefined ? Math.round(highTemp) + '°' : 'N/A'} /
                        {lowTemp !== null && lowTemp !== undefined ? Math.round(lowTemp) + '°' : 'N/A'}
                    </span>
                 </div>
              ) : null}

              {/* Wind */}
              {windSpeed !== null && windSpeed !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Wind: <span className="ml-2 font-medium">{Math.round(windSpeed)} mph</span>
                 </div>
              ) : null}

              {/* Humidity */}
              {humidity !== null && humidity !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Humidity: <span className="ml-2 font-medium">{Math.round(humidity * 100)}%</span> {/* Convert 0-1 to % */}
                 </div>
              ) : null}

              {/* Dew Point */}
               {dewPoint !== null && dewPoint !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Dew Point: <span className="ml-2 font-medium">{Math.round(dewPoint)}°</span>
                 </div>
              ) : null}

              {/* Pressure */}
               {pressure !== null && pressure !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Pressure: <span className="ml-2 font-medium">{pressure.toFixed(1)} mb</span>
                 </div>
              ) : null}

              {/* UV Index */}
              {uvIndex !== null && uvIndex !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    UV Index: <span className="ml-2 font-medium">
                       {uvIndex >= 8 ? 'Very High' : uvIndex >= 6 ? 'High' : uvIndex >= 3 ? 'Moderate' : 'Low'} ({uvIndex})
                    </span>
                 </div>
              ) : null}

              {/* Visibility */}
              {visibility !== null && visibility !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Visibility: <span className="ml-2 font-medium">{visibility.toFixed(1)} miles</span>
                 </div>
              ) : null}

              {/* Moon Phase */}
               {moonPhase !== null && moonPhase !== undefined ? (
                 <div className="flex items-center">
                    {/* No icon */}
                    Moon Phase: <span className="ml-2 font-medium">{getMoonPhaseDescription(moonPhase)}</span>
                 </div>
              ) : null}

            </div>

            {/* Matching City Display - New Section */}
            {matchingCities.length > 0 && (
                <div className="mt-6 p-4 bg-white/30 rounded-lg backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Cities with Similar Weather Conditions:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchingCities.map((match, index) => (
                            <div 
                                key={index} 
                                className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                            >
                                <div>
                                    <span className="font-medium text-gray-800">{match.city}</span>
                                    <span className="text-sm text-gray-600 ml-2">({match.continent})</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    Similarity: {(100 - match.difference).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}