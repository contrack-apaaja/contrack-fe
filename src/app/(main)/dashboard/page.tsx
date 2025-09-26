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
    <div className="pl-64">
      <main className="p-8">
        <h1>Welcome to the Dashboard</h1>
        <p>Select an option from the sidebar.</p>
      </main>
    </div>
  );
};

export default DashboardPage;