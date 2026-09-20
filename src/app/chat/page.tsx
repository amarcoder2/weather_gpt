import type { Metadata } from 'next';
import { ChatPage } from '@/views/ChatPage';

export const metadata: Metadata = {
  title: 'Conversational Weather AI | WeatherGPT',
  description: 'AI-assisted meteorological reasoning, localized weather queries, and crisis directives.',
};

export default function Chat() {
  return <ChatPage />;
}
