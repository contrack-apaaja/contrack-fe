import { authUtils } from '@/services/api';

export type UserRole = 'REGULAR' | 'LEGAL' | 'MANAGEMENT';

export const rolePermissions = {
  REGULAR: {
    canAccessDashboard: true,
    canAccessContracts: true,
    canAccessClauses: true,
    canAccessLegalReview: false,
    canAccessManagement: false,
  },
  LEGAL: {
    canAccessDashboard: true,
    canAccessContracts: true,
    canAccessClauses: true,
    canAccessLegalReview: true,
    canAccessManagement: false,
  },
  MANAGEMENT: {
    canAccessDashboard: true,
    canAccessContracts: true,
    canAccessClauses: true,
    canAccessLegalReview: false,
    canAccessManagement: true,
  },
};

export const getCurrentUserRole = (): UserRole | null => {
  const userData = authUtils.getUserData();
  return userData?.role as UserRole || null;
};

export const hasPermission = (permission: keyof typeof rolePermissions.REGULAR): boolean => {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  
  return rolePermissions[userRole][permission];
};

export const canAccessPage = (page: 'dashboard' | 'contracts' | 'clauses' | 'legal' | 'management'): boolean => {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;

  switch (page) {
    case 'dashboard':
    case 'contracts':
    case 'clauses':
      return true; // All roles can access these pages
    case 'legal':
      return userRole === 'LEGAL';
    case 'management':
      return userRole === 'MANAGEMENT';
    default:
      return false;
  }
};

export const requireRole = (allowedRoles: UserRole[]): boolean => {
  const userRole = getCurrentUserRole();
  return userRole ? allowedRoles.includes(userRole) : false;
};
