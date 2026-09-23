import { NextResponse } from 'next/server';
import { locationRepository } from '@/lib/db/postgres';

export async function GET() {
  try {
    const stats = await locationRepository.getStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('[API Location Stats Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve location statistics.' },
      { status: 500 }
    );
  }
}
