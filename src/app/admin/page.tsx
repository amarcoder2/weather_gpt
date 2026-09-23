import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, isAdminRole } from '@/lib/auth/jwt';
import { AdminClient } from './AdminClient';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Admin Control Center | WeatherGPT',
  description: 'Mission Operations, IMD Doppler & AWS ingestion telemetry, CAP alert broadcast, and system audit logs.',
};

export default async function Admin() {
  // LAYER 2: Server-Side Page Route Authorization
  const cookieStore = await cookies();
  const token = cookieStore.get('weathergpt_token')?.value;

  if (!token) {
    redirect('/login?redirect=%2Fadmin');
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    redirect('/login?redirect=%2Fadmin');
  }

  if (!isAdminRole(payload.role)) {
    redirect('/dashboard?forbidden=admin_only');
  }

  return (
    <AuthGuard requiredRole="admin">
      <AdminClient />
    </AuthGuard>
  );
}
