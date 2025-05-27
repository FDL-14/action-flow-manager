

import { User, Company, Responsible, Client, Action, ActionNote } from './types';

export const defaultMasterUser: User = {
  id: "1",
  name: "Administrador",
  cpf: "80243088191", // CPF limpo sem formatação para garantir consistência
  email: "admin@totaldata.com.br",
  role: "master" as const,
  companyIds: ["1"],
  password: "@54321", // Senha padrão definida
  permissions: [
    {
      id: "1",
      name: "Master",
      description: "All permissions",
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canMarkComplete: true,
      canMarkDelayed: true,
      canAddNotes: true,
      canViewReports: true,
      viewAllActions: true,
      canEditUser: true,
      canEditAction: true,
      canEditClient: true,
      canDeleteClient: true,
      canCreateClient: true,
      canEditCompany: true,
      canDeleteCompany: true,
      viewOnlyAssignedActions: false,
      canCreateUsersAdmin: true,
      canCreateUsersLimited: true,
      canCreateCompanies: true,
      canCreateClientsLimited: true,
      canCreateStages: true,
      canDownloadReportsLimited: true,
      canDeleteActionsLimited: true,
      canDeleteStages: true
    }
  ]
};

// Deixando apenas usuário administrador
export const additionalUsers: User[] = [];

// Export the combined users array for AuthContext to use
export const mockUsers = [
  defaultMasterUser
];

// Empresa padrão básica para não quebrar referências no sistema
export const defaultCompany: Company = {
  id: '1',
  name: 'Minha Empresa',
  address: '',
  cnpj: '',
  phone: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Limpando todas as empresas adicionais
export const additionalCompanies: Company[] = [];

// Limpando responsáveis
export const mockResponsibles: Responsible[] = [];

// Limpando clientes
export const mockClients: Client[] = [];

// Limpando notas de ações
export const sampleActionNotes: ActionNote[] = [];

// Limpando ações
export const mockActions: Action[] = [];

