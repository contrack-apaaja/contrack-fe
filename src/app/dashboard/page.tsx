"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';

const DashboardPage = () => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: '250px', background: '#f4f4f4', padding: '20px' }}>
        <h3>Sidebar</h3>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/contract">Contract</Link></li>
            <li><Link href="/notification">Notification</Link></li>
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '20px' }}>
        <h1>Welcome to the Dashboard</h1>
        <p>Select an option from the sidebar.</p>
      </main>
    </div>
  );
};

export default DashboardPage;