import { NextRequest, NextResponse } from 'next/server';

interface ReverseGeocodeResponse {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  country: string;
  display_name: string;
}

// Known reference stations across India for fast mathematical nearest fallback
const KNOWN_STATIONS = [
  { name: 'Kolkata', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Bhubaneswar', district: 'Khurda', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
  { name: 'New Delhi', district: 'Central Delhi', state: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Guwahati', district: 'Kamrup', state: 'Assam', lat: 26.1445, lon: 91.7362 },
  { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Patna', district: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366 },
  { name: 'Srinagar', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
  { name: 'Port Blair', district: 'South Andaman', state: 'Andaman and Nicobar', lat: 11.6234, lon: 92.7265 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestFallback(lat: number, lon: number): ReverseGeocodeResponse {
  let closest = KNOWN_STATIONS[0];
  let minDistance = Infinity;

  for (const st of KNOWN_STATIONS) {
    const dist = haversineDistance(lat, lon, st.lat, st.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = st;
    }
  }

  return {
    latitude: lat,
    longitude: lon,
    city: closest.name,
    district: closest.district,
    state: closest.state,
    country: 'India',
    display_name: `${closest.name}, ${closest.district}, ${closest.state}, India`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get('latitude');
    const lonParam = searchParams.get('longitude');

    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Latitude and longitude query parameters are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180.' },
        { status: 400 }
      );
    }

    // 1. Try BigDataCloud reverse geocode API (Free, high accuracy, doesn't require key)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (bdcRes.ok) {
        const data = await bdcRes.json();
        const city =
          data.city ||
          data.locality ||
          data.principalSubdivisionDistrict ||
          data.municipality ||
          data.localityName ||
          'Local Area';
        const district = data.principalSubdivisionDistrict || data.locality || city;
        const state = data.principalSubdivision || data.countryName || 'India';
        const country = data.countryName || 'India';

        const displayName = [city, district, state, country]
          .filter((v, i, arr) => v && arr.indexOf(v) === i)
          .join(', ');

        return NextResponse.json<ReverseGeocodeResponse>({
          latitude: lat,
          longitude: lon,
          city,
          district,
          state,
          country,
          display_name: displayName,
        });
      }
    } catch {
      // Fall through to Nominatim or mathematical nearest
    }

    // 2. Try OpenStreetMap Nominatim with custom User-Agent
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
      const osmRes = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'WeatherGPT-SIH-2026/1.0 (Ministry of Earth Sciences / IMD Problem #26068)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (osmRes.ok) {
        const data = await osmRes.json();
        const addr = data.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.suburb ||
          addr.village ||
          addr.county ||
          'Local Area';
        const district = addr.county || addr.state_district || city;
        const state = addr.state || 'India';
        const country = addr.country || 'India';

        const displayName = [city, district, state, country]
          .filter((v, i, arr) => v && arr.indexOf(v) === i)
          .join(', ');

        return NextResponse.json<ReverseGeocodeResponse>({
          latitude: lat,
          longitude: lon,
          city,
          district,
          state,
          country,
          display_name: displayName,
        });
      }
    } catch {
      // Fall through to nearest reference station
    }

    // 3. Robust Haversine Fallback: find closest meteorological station
    const nearest = findNearestFallback(lat, lon);
    return NextResponse.json<ReverseGeocodeResponse>(nearest);
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return NextResponse.json(
      { error: 'Internal server error while resolving coordinates.' },
      { status: 500 }
    );
  }
}
