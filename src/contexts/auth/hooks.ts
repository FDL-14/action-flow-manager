
import { useContext } from 'react';
import { User } from './types';
import { AuthContext } from './AuthContext';

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Helper function to check user permissions
export const useUserPermissions = (user: User | null) => {
  const canEditResponsibles = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].canEdit;
  };

  const canDeleteResponsibles = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].canDelete;
  };

  const getCompanyIds = () => {
    if (!user) return [];
    return user.companyIds || [];
  };

  const getClientIds = () => {
    if (!user) return [];
    return user.clientIds || [];
  };

  const canViewAllActions = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].viewAllActions;
  };

  const shouldViewOnlyAssignedActions = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return true; // Default to restricted view
    }
    return user.permissions[0].viewOnlyAssignedActions;
  };

  return {
    canEditResponsibles,
    canDeleteResponsibles,
    getCompanyIds,
    getClientIds,
    canViewAllActions,
    shouldViewOnlyAssignedActions
  };
};
