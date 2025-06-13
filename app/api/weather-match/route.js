import { WeatherMatcher } from '../../../utils/weatherMatcher';
import { NextResponse } from 'next/server';

const weatherMatcher = new WeatherMatcher();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');
        const cityName = searchParams.get('city');

        if (!lat || !lon) {
            return NextResponse.json(
                { error: 'Missing latitude or longitude' }, 
                { status: 400 }
            );
        }

        const targetWeather = await weatherMatcher.fetchWeatherData(
            parseFloat(lat), 
            parseFloat(lon)
        );

        if (!targetWeather) {
            return NextResponse.json(
                { error: 'Failed to fetch target weather data' }, 
                { status: 500 }
            );
        }

        const matchingCities = await weatherMatcher.findClosestMatches(targetWeather, cityName);
        
        if (!matchingCities) {
            return NextResponse.json(
                { error: 'Failed to find matching cities' }, 
                { status: 500 }
            );
        }

        return NextResponse.json({ matching_cities: matchingCities });
    } catch (error) {
        console.error('Weather matching error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message }, 
            { status: 500 }
        );
    }
}