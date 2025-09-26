"use client";

import React, { useEffect } from 'react';

const DashboardPage = () => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <main style={{ flex: 1, padding: '20px' }}>
        <h1>Welcome to the Dashboard</h1>
        <p>Select an option from the sidebar.</p>
      </main>
    </div>
  );
};

export default DashboardPage;