"use client";

import React, { useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 pl-64">
        <main className="w-full p-8">
          {children}
        </main>
      </div>
    </div>
  );
}