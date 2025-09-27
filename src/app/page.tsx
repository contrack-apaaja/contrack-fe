'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils } from '@/services/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    if (authUtils.isAuthenticated()) {
      // If logged in, redirect to dashboard
      router.replace('/dashboard');
    } else {
      // If not logged in, redirect to login
      router.replace('/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
