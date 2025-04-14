
import React, { createContext, useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  AuthContextType, 
  AuthState,
  AddUserData,
  UpdateUserData
} from './types';
import { 
  fetchUserProfile, 
  fetchAllUsers, 
  loginUser, 
  logoutUser,
  addUser as apiAddUser,
  updateUser as apiUpdateUser,
  changeUserPassword,
  resetUserPassword as apiResetUserPassword
} from './api';
import { useUserPermissions } from './hooks';

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  addUser: async () => false,
  updateUser: async () => false,
  changePassword: async () => false,
  resetUserPassword: () => {},
  canUserEditResponsibles: () => false,
  canUserDeleteResponsibles: () => false,
  getUserCompanyIds: () => [],
  getUserClientIds: () => [],
  canViewAllActions: () => false,
  shouldViewOnlyAssignedActions: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [state, setState] = useState<AuthState>({
    user: null,
    users: [],
    isAuthenticated: false,
    supabaseUser: null,
    session: null,
  });
  
  // Load session data on mount
  useEffect(() => {
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      setState(prevState => ({
        ...prevState,
        session,
        supabaseUser: session?.user ?? null,
        isAuthenticated: !!session?.user
      }));
      
      if (session?.user) {
        // Fetch user profile when authenticated
        setTimeout(() => loadUserProfile(session.user.id), 0);
      } else {
        setState(prevState => ({
          ...prevState,
          user: null
        }));
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session);
      
      setState(prevState => ({
        ...prevState,
        session,
        supabaseUser: session?.user ?? null,
        isAuthenticated: !!session?.user
      }));
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load users from Supabase
  useEffect(() => {
    if (state.supabaseUser) {
      loadAllUsers();
    }
  }, [state.supabaseUser]);

  // Load user profile
  const loadUserProfile = async (userId: string) => {
    const userProfile = await fetchUserProfile(userId);
    
    if (userProfile) {
      setState(prevState => ({
        ...prevState,
        user: userProfile
      }));
    }
  };

  // Load all users
  const loadAllUsers = async () => {
    const allUsers = await fetchAllUsers();
    
    setState(prevState => ({
      ...prevState,
      users: allUsers
    }));
  };

  // Login
  const login = async (email: string, password: string) => {
    return await loginUser(email, password);
  };

  // Logout
  const logout = async () => {
    const success = await logoutUser();
    
    if (success) {
      setState({
        user: null,
        users: [],
        isAuthenticated: false,
        supabaseUser: null,
        session: null
      });
    }
  };

  // Add user
  const addUser = async (userData: AddUserData) => {
    const success = await apiAddUser(userData);
    
    if (success) {
      // Reload users list
      await loadAllUsers();
    }
    
    return success;
  };

  // Update user
  const updateUser = async (userData: UpdateUserData) => {
    const success = await apiUpdateUser(userData);
    
    if (success) {
      // Reload users list
      await loadAllUsers();
      
      // Update current user if needed
      if (state.user && state.user.id === userData.id) {
        await loadUserProfile(userData.id);
      }
    }
    
    return success;
  };

  // Change password
  const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    return await changeUserPassword(userId, currentPassword, newPassword);
  };

  // Reset user password
  const resetUserPassword = (userId: string) => {
    apiResetUserPassword(userId);
  };

  // Get permissions helper functions
  const permissionsHelpers = useUserPermissions(state.user);

  // Context value
  const contextValue: AuthContextType = {
    user: state.user,
    users: state.users,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    addUser,
    updateUser,
    changePassword,
    resetUserPassword,
    canUserEditResponsibles: permissionsHelpers.canEditResponsibles,
    canUserDeleteResponsibles: permissionsHelpers.canDeleteResponsibles,
    getUserCompanyIds: permissionsHelpers.getCompanyIds,
    getUserClientIds: permissionsHelpers.getClientIds,
    canViewAllActions: permissionsHelpers.canViewAllActions,
    shouldViewOnlyAssignedActions: permissionsHelpers.shouldViewOnlyAssignedActions
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
