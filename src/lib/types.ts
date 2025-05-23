
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
  isResponsible?: boolean; // Flag to indicate if user is registered as a responsible
  isRequester?: boolean; // Flag to indicate if user is registered as a requester
  supabaseAuthId?: string; // ID in the Supabase auth system
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
  canCreateClient: boolean;
  canEditCompany: boolean;
  canDeleteCompany: boolean;
  viewOnlyAssignedActions: boolean;
  canCreateUsersAdmin: boolean;
  canCreateUsersLimited: boolean;
  canCreateCompanies: boolean;
  canCreateClientsLimited: boolean;
  canCreateStages: boolean;
  canDownloadReportsLimited: boolean;
  canDeleteActionsLimited: boolean;
  canDeleteStages: boolean;
}

export interface Action {
  id: string;
  subject: string;
  description: string;
  status: 'nao_visualizada' | 'nao_iniciada' | 'pendente' | 'concluido' | 'atrasado' | 'aguardando_aprovacao';
  responsibleId: string;
  startDate: Date;
  endDate: Date;
  companyId: string;
  companyName?: string; 
  clientId?: string;
  clientName?: string;
  requesterId?: string;
  requesterName?: string;
  responsibleName?: string;
  completedAt?: Date;
  attachments?: string[];
  notes: ActionNote[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  createdByName?: string;
  approved?: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  completionNotes?: string;
  approvalRequired?: boolean;
  approverId?: string;
  approverName?: string;
  stageId?: string;
  parentActionId?: string;
  isSubtask?: boolean;
  order?: number;
  stages?: ActionStage[];
  isPersonal?: boolean;
  personalReminderSettings?: PersonalReminderSettings;
}

export interface PersonalReminderSettings {
  reminderBeforeHours: number;
  reminderFrequencyHours: number;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  internalEnabled: boolean;
}

export interface ActionNote {
  id: string;
  actionId: string;
  content: string;
  createdBy: string;
  createdByName?: string; // Added to store creator name directly
  createdAt: Date;
  isDeleted: boolean;
  attachments?: string[]; // Added support for attachments in notes
}

export interface ActionAttachment {
  id: string;
  actionId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdAt: Date;
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
  companyName?: string; // Explicit property to store the name of the company
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
  isSystemUser?: boolean; // Flag to identify if this responsible is also a system user
}

export interface ActionSummary {
  completed: number;
  delayed: number;
  pending: number;
  total: number;
  completionRate: number;
  notStarted: number;
  notViewed: number;
  awaitingApproval: number;
}

export interface ActionStage {
  id: string;
  actionId: string;
  title: string;
  description?: string;
  order: number;
  parentStageId?: string;
  isSequential: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  tasks?: Action[];
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  internalEnabled: boolean;
  reminderBeforeHours: number;
  reminderFrequencyHours: number;
  createdAt: Date;
  updatedAt: Date;
}
