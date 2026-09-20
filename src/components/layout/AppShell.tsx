'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationModal } from './NotificationModal';
import { VoiceModal } from './VoiceModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <Header onOpenNotifications={() => setIsNotificationOpen(true)} />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Scrollable Page Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-20 md:pb-8 focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Bottom Nav & Drawer (Mobile) */}
      <MobileNav />

      {/* Global Modals */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
      <VoiceModal />
    </div>
  );
};
