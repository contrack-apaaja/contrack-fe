"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen">
      {/* Hamburger Button - Always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-white shadow-lg hover:bg-gray-50"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </Button>

      {!isCollapsed && <Sidebar />}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0' : 'ml-64'}`}>
        <main className="w-full p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <SidebarProvider>
      <MainContent>
        {children}
      </MainContent>
    </SidebarProvider>
  );
}