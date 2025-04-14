
import { User, Permission, UserPermissions } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Normalize CPF - remove non-numeric characters
export const normalizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

// Validate and convert user role to the correct type
export const validateUserRole = (role: string | null | undefined): 'user' | 'master' => {
  if (role === 'master') return 'master';
  return 'user'; // Default to 'user' for any invalid value
};

// Map database permissions to application permissions format
export const mapPermissionsFromDB = (
  permissionsObj: any, 
  defaultPermissions: any
): Permission => {
  return {
    id: "default",
    name: "Default Permissions",
    description: "Default user permissions",
    canCreate: permissionsObj.can_create === null ? defaultPermissions.can_create : permissionsObj.can_create,
    canEdit: permissionsObj.can_edit === null ? defaultPermissions.can_edit : permissionsObj.can_edit,
    canDelete: permissionsObj.can_delete === null ? defaultPermissions.can_delete : permissionsObj.can_delete,
    canMarkComplete: permissionsObj.can_mark_complete === null ? defaultPermissions.can_mark_complete : permissionsObj.can_mark_complete,
    canMarkDelayed: permissionsObj.can_mark_delayed === null ? defaultPermissions.can_mark_delayed : permissionsObj.can_mark_delayed,
    canAddNotes: permissionsObj.can_add_notes === null ? defaultPermissions.can_add_notes : permissionsObj.can_add_notes,
    canViewReports: permissionsObj.can_view_reports === null ? defaultPermissions.can_view_reports : permissionsObj.can_view_reports,
    viewAllActions: permissionsObj.view_all_actions === null ? defaultPermissions.view_all_actions : permissionsObj.view_all_actions,
    canEditUser: permissionsObj.can_edit_user === null ? defaultPermissions.can_edit_user : permissionsObj.can_edit_user,
    canEditAction: permissionsObj.can_edit_action === null ? defaultPermissions.can_edit_action : permissionsObj.can_edit_action,
    canEditClient: permissionsObj.can_edit_client === null ? defaultPermissions.can_edit_client : permissionsObj.can_edit_client,
    canDeleteClient: permissionsObj.can_delete_client === null ? defaultPermissions.can_delete_client : permissionsObj.can_delete_client,
    canEditCompany: permissionsObj.can_edit_company === null ? defaultPermissions.can_edit_company : permissionsObj.can_edit_company,
    canDeleteCompany: permissionsObj.can_delete_company === null ? defaultPermissions.can_delete_company : permissionsObj.can_delete_company,
    viewOnlyAssignedActions: permissionsObj.view_only_assigned_actions === null ? defaultPermissions.view_only_assigned_actions : permissionsObj.view_only_assigned_actions
  };
};

// Get default permissions based on user role
export const getDefaultPermissions = (role: 'user' | 'master') => {
  return {
    can_create: role === 'master',
    can_edit: role === 'master',
    can_delete: role === 'master',
    can_mark_complete: true,
    can_mark_delayed: true,
    can_add_notes: true,
    can_view_reports: role === 'master',
    view_all_actions: role === 'master',
    can_edit_user: role === 'master',
    can_edit_action: role === 'master',
    can_edit_client: role === 'master',
    can_delete_client: role === 'master',
    can_edit_company: role === 'master',
    can_delete_company: role === 'master',
    view_only_assigned_actions: role !== 'master',
  };
};

// Transform permissions from app format to database format
export const transformPermissionsForDB = (
  userId: string,
  permissions: UserPermissions | undefined,
  defaultPermissions: any
) => {
  return {
    user_id: userId,
    can_create: permissions?.canCreate !== undefined ? 
      permissions.canCreate : defaultPermissions.can_create,
    can_edit: permissions?.canEdit !== undefined ? 
      permissions.canEdit : defaultPermissions.can_edit,
    can_delete: permissions?.canDelete !== undefined ? 
      permissions.canDelete : defaultPermissions.can_delete,
    can_mark_complete: permissions?.canMarkComplete !== undefined ? 
      permissions.canMarkComplete : defaultPermissions.can_mark_complete,
    can_mark_delayed: permissions?.canMarkDelayed !== undefined ? 
      permissions.canMarkDelayed : defaultPermissions.can_mark_delayed,
    can_add_notes: permissions?.canAddNotes !== undefined ? 
      permissions.canAddNotes : defaultPermissions.can_add_notes,
    can_view_reports: permissions?.canViewReports !== undefined ? 
      permissions.canViewReports : defaultPermissions.can_view_reports,
    view_all_actions: permissions?.viewAllActions !== undefined ? 
      permissions.viewAllActions : defaultPermissions.view_all_actions,
    can_edit_user: permissions?.canEditUser !== undefined ? 
      permissions.canEditUser : defaultPermissions.can_edit_user,
    can_edit_action: permissions?.canEditAction !== undefined ? 
      permissions.canEditAction : defaultPermissions.can_edit_action,
    can_edit_client: permissions?.canEditClient !== undefined ? 
      permissions.canEditClient : defaultPermissions.can_edit_client,
    can_delete_client: permissions?.canDeleteClient !== undefined ? 
      permissions.canDeleteClient : defaultPermissions.can_delete_client,
    can_edit_company: permissions?.canEditCompany !== undefined ? 
      permissions.canEditCompany : defaultPermissions.can_edit_company,
    can_delete_company: permissions?.canDeleteCompany !== undefined ? 
      permissions.canDeleteCompany : defaultPermissions.can_delete_company,
    view_only_assigned_actions: permissions?.viewOnlyAssignedActions !== undefined ? 
      permissions.viewOnlyAssignedActions : defaultPermissions.view_only_assigned_actions
  };
};

// Create user object from profile and permissions
export const createUserObject = (profile: any, mappedPermissions: Permission): User => {
  return {
    id: profile.id,
    name: profile.name,
    cpf: profile.cpf || '',
    email: profile.email || '',
    role: profile.role as 'user' | 'master',
    companyIds: profile.company_ids || ['1'],
    clientIds: profile.client_ids || [],
    permissions: [mappedPermissions]
  };
};
