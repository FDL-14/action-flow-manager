
export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: 'user' | 'master';
  companyIds: string[]; // Companies user has access to
  clientIds?: string[]; // Clients user has access to
  permissions: Permission[];
  password?: string;
  responsibleId?: string; // Link to the responsible record
  phone?: string; // Added phone property for users
  department?: string; // Added department property for users
  requesterIds?: string[]; // IDs of requesters associated with this user
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

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  cnpj?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  cnpj?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Responsible {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  type?: 'responsible' | 'requester';
  companyId: string;
  companyName?: string;
  clientIds?: string[]; // Clients this responsible is assigned to
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // The ID of the user associated with this responsible
  isSystemUser?: boolean; // Added flag to identify if this is a system user automatically added
}

export interface ActionNote {
  id: string;
  actionId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  isDeleted: boolean;
}

export interface Action {
  id: string;
  subject: string;
  description: string;
  status: 'pendente' | 'concluido' | 'atrasado';
  responsibleId: string;
  startDate: Date;
  endDate: Date;
  companyId: string;
  clientId?: string;
  requesterId?: string;
  completedAt?: Date;
  attachments?: string[];
  notes: ActionNote[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  createdByName?: string;
}

export interface ActionSummary {
  completed: number;
  delayed: number;
  pending: number;
  total: number;
  completionRate: number;
}
