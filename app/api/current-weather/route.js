import { WeatherMatcher } from '../../../utils/weatherMatcher';
import { NextResponse } from 'next/server';

const weatherMatcher = new WeatherMatcher();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json(
            { error: 'Missing latitude or longitude' }, 
            { status: 400 }
        );
    }

    try {
        const currentWeather = await weatherMatcher.getCurrentWeather(
            parseFloat(lat), 
            parseFloat(lon)
        );
        return NextResponse.json(currentWeather);
    } catch (error) {
        return NextResponse.json(
            { error: error.message }, 
            { status: 500 }
        );
    }
}