
export interface User {
  id: string;
  cpf: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  permissions: Permission[];
  accessibleCompanies?: string[]; // IDs of companies the user can access
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canMarkComplete?: boolean;
  canMarkDelayed?: boolean;
  canAddNotes?: boolean;
  canViewReports?: boolean;
  viewAllActions?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Responsible {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface ActionSummary {
  completed: number;
  delayed: number;
  pending: number;
  total: number;
  completionRate: number;
}
