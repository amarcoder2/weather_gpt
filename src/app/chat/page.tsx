import type { Metadata } from 'next';
import { ChatPage } from '@/views/ChatPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Ask WeatherGPT | Conversational Meteorological AI',
  description: 'Natural language weather queries, crop advisories, and disaster guidance powered by IMD and MoES data.',
};

export default function Chat() {
  return (
    <AuthGuard>
      <ChatPage />
    </AuthGuard>
  );
}
