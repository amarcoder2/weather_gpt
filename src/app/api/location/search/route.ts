import { NextRequest, NextResponse } from 'next/server';
import { locationRepository } from '@/lib/db/postgres';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q') || searchParams.get('query') || '';
    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;
    const localityType = searchParams.get('type') || searchParams.get('locality_type') || undefined;
    const id = searchParams.get('id') || undefined;

    // Direct ID lookup shortcut
    if (id) {
      const loc = await locationRepository.findById(id);
      if (!loc) {
        return NextResponse.json(
          { success: false, error: 'Location not found.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        location: {
          id: loc.id,
          name: loc.name,
          district: loc.district,
          state: loc.state,
          state_code: loc.state_code,
          locality_type: loc.locality_type,
          latitude: loc.latitude,
          longitude: loc.longitude,
          elevation: loc.elevation,
          population: loc.population,
        },
      });
    }

    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

    const limit = isNaN(limitParam) ? 20 : Math.min(Math.max(1, limitParam), 100);
    const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

    // Defense-in-depth: limit maximum query length to prevent regex/string DOS
    const sanitizedQuery = query.slice(0, 100).trim();

    const rawLocations = await locationRepository.search({
      query: sanitizedQuery,
      state: state?.slice(0, 100),
      district: district?.slice(0, 100),
      localityType: localityType?.slice(0, 50),
      limit,
      offset,
    });

    // Sanitize response and map to client-safe representation
    const locations = rawLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      district: loc.district,
      state: loc.state,
      state_code: loc.state_code,
      locality_type: loc.locality_type,
      latitude: loc.latitude,
      longitude: loc.longitude,
      elevation: loc.elevation,
      population: loc.population,
    }));

    return NextResponse.json({
      success: true,
      locations,
      count: locations.length,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[API Location Search Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to execute location search.' },
      { status: 500 }
    );
  }
}
