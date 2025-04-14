
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: 'user' | 'master';
  companyIds: string[];
  clientIds: string[];
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMarkComplete: boolean;
  canMarkDelayed: boolean;
  canAddNotes: boolean;
  canViewReports: boolean;
  viewAllActions: boolean;
  canEditUser: boolean;
  canEditAction: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  canEditCompany: boolean;
  canDeleteCompany: boolean;
  viewOnlyAssignedActions: boolean;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: AddUserData) => Promise<boolean>;
  updateUser: (userData: UpdateUserData) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => void;
  canUserEditResponsibles: () => boolean;
  canUserDeleteResponsibles: () => boolean;
  getUserCompanyIds: () => string[];
  getUserClientIds: () => string[];
  canViewAllActions: () => boolean;
  shouldViewOnlyAssignedActions: () => boolean;
}

export interface AddUserData {
  name: string;
  cpf: string;
  email: string;
  role: 'user' | 'master';
  companyIds: string[];
  clientIds?: string[];
  permissions?: UserPermissions;
}

export interface UpdateUserData extends AddUserData {
  id: string;
}

export interface UserPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMarkComplete: boolean;
  canMarkDelayed: boolean;
  canAddNotes: boolean;
  canViewReports: boolean;
  viewAllActions: boolean;
  canEditUser: boolean;
  canEditAction: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  canEditCompany?: boolean;
  canDeleteCompany?: boolean;
  viewOnlyAssignedActions: boolean;
}

export interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
}
