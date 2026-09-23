import { NextRequest, NextResponse } from 'next/server';
import { locationRepository } from '@/lib/db/postgres';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing location ID.' },
        { status: 400 }
      );
    }

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
  } catch (err) {
    console.error('[API Location Resolution Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve location details.' },
      { status: 500 }
    );
  }
}
