import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../lib/auth/jwt';
import { userRepository } from '../../../../lib/db/postgres';

export async function POST(req: NextRequest) {
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to save location.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { latitude, longitude, location_name } = body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !location_name ||
      typeof location_name !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Valid latitude, longitude, and location_name are required.' },
        { status: 400 }
      );
    }

    const updated = await userRepository.updateLocation(payload.userId, {
      latitude,
      longitude,
      location_name: location_name.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update user location.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Location saved successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        latitude: updated.latitude,
        longitude: updated.longitude,
        location_name: updated.location_name,
        location_updated_at: updated.location_updated_at,
      },
    });
  } catch (err) {
    console.error('Save location error:', err);
    return NextResponse.json(
      { error: 'Internal server error while saving location.' },
      { status: 500 }
    );
  }
}
