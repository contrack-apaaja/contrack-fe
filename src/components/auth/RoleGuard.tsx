"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserRole, canAccessPage, UserRole } from '@/utils/auth';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPage?: 'dashboard' | 'contracts' | 'clauses' | 'legal' | 'management';
  fallbackPath?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  requiredPage, 
  fallbackPath = '/dashboard' 
}: RoleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthorization = () => {
      const userRole = getCurrentUserRole();
      
      if (!userRole) {
        // No user role found, redirect to login
        router.push('/login');
        return;
      }

      let authorized = true;

      // Check page-specific access
      if (requiredPage) {
        authorized = canAccessPage(requiredPage);
      }

      // Check role-specific access
      if (allowedRoles && authorized) {
        authorized = allowedRoles.includes(userRole);
      }

      setIsAuthorized(authorized);
      setIsLoading(false);

      if (!authorized) {
        // Redirect to fallback path or dashboard
        router.push(fallbackPath);
      }
    };

    checkAuthorization();
  }, [allowedRoles, requiredPage, fallbackPath, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
