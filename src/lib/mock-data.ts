
import { User, Company, Responsible, Client, Action, ActionNote } from './types';

export const defaultMasterUser: User = {
  id: '1',
  cpf: '80243088191',
  name: 'Administrador Master',
  email: 'admin@gestaodeacoes.com',
  role: 'master',
  companyIds: ['1'], // Adding the companyIds property with default company
  permissions: [
    { 
      id: '1', 
      name: 'all', 
      description: 'Acesso total ao sistema',
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
      viewOnlyAssignedActions: false
    }
  ]
};

// Usuários adicionais para garantir acesso
export const additionalUsers: User[] = [
  {
    id: '2',
    cpf: '70635016150',
    name: 'LEONARDO CARRIJO MARTINS',
    email: 'leonardo@example.com',
    role: 'user',
    companyIds: ['1'],
    clientIds: [],
    permissions: [
      {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: true,
        canEditClient: false,
        canDeleteClient: false,
        viewOnlyAssignedActions: true
      }
    ]
  },
  {
    id: '3',
    cpf: '26722272842',
    name: 'OUTRO USUÁRIO',
    email: 'outro@example.com',
    role: 'user',
    companyIds: ['1'],
    clientIds: [],
    permissions: [
      {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: true,
        canEditClient: false,
        canDeleteClient: false,
        viewOnlyAssignedActions: true
      }
    ]
  },
  {
    id: '4',
    cpf: '01938414101',
    name: 'FULANO TESTE',
    email: 'fulano@example.com',
    role: 'user',
    companyIds: ['1'],
    clientIds: [],
    permissions: [
      {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: true,
        canEditClient: false,
        canDeleteClient: false,
        viewOnlyAssignedActions: true
      }
    ]
  },
  {
    id: '5',
    cpf: '24908676879',
    name: 'FUNCIONÁRIO TESTE',
    email: 'funcionario@example.com',
    role: 'user',
    companyIds: ['1'],
    clientIds: [],
    permissions: [
      {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: true,
        canEditClient: false,
        canDeleteClient: false,
        viewOnlyAssignedActions: true
      }
    ]
  }
];

export const defaultCompany: Company = {
  id: '1',
  name: 'Minha Empresa',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Empresas adicionais para testes
export const additionalCompanies: Company[] = [
  {
    id: '2',
    name: 'Empresa Secundária', 
    address: 'Rua das Flores, 123',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Terceira Empresa',
    address: 'Avenida Principal, 456',
    cnpj: '98.765.432/0001-10',
    phone: '(11) 12345-6789',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockResponsibles: Responsible[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    department: 'Desenvolvimento',
    role: 'Desenvolvedor',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Maria Souza',
    email: 'maria@example.com',
    department: 'Documentação',
    role: 'Analista',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    department: 'Testes',
    role: 'QA',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Ana Santos',
    email: 'ana@example.com',
    department: 'Desenvolvimento',
    role: 'Desenvolvedora',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Cliente A',
    email: 'clientea@example.com',
    phone: '(11) 98765-4321',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Cliente B',
    email: 'clienteb@example.com',
    phone: '(11) 91234-5678',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Cliente C',
    email: 'clientec@example.com',
    phone: '(11) 99876-5432',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Cliente D',
    email: 'cliented@example.com',
    phone: '(11) 95555-5555',
    companyId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

export const sampleActionNotes: ActionNote[] = [
  {
    id: '1',
    actionId: '1',
    content: 'Iniciando o desenvolvimento do módulo de relatórios financeiros',
    createdBy: '1',
    createdAt: new Date('2023-06-14T10:00:00'),
    isDeleted: false
  },
  {
    id: '2',
    actionId: '1',
    content: 'Ajustes na exportação para Excel concluídos',
    createdBy: '1',
    createdAt: new Date('2023-06-20T16:30:00'),
    isDeleted: false
  }
];

export const mockActions: Action[] = [
  {
    id: '1',
    subject: 'Desenvolver novo módulo',
    description: 'Desenvolver o módulo de relatórios financeiros com exportação para Excel',
    status: 'concluido',
    responsibleId: '1',
    startDate: new Date('2023-06-14'),
    endDate: new Date('2023-06-29'),
    companyId: '1',
    clientId: '1',
    requesterId: '2',
    completedAt: new Date('2023-06-27'),
    attachments: [],
    notes: sampleActionNotes,
    createdAt: new Date('2023-06-14'),
    updatedAt: new Date('2023-06-27')
  },
  {
    id: '2',
    subject: 'Atualizar documentação',
    description: 'Atualizar toda a documentação técnica do projeto incluindo os novos endpoints.',
    status: 'atrasado',
    responsibleId: '2',
    startDate: new Date('2023-05-31'),
    endDate: new Date('2023-06-10'),
    companyId: '1',
    clientId: '2',
    requesterId: '1',
    attachments: [],
    notes: [],
    createdAt: new Date('2023-05-31'),
    updatedAt: new Date('2023-05-31')
  },
  {
    id: '3',
    subject: 'Testes de integração',
    description: 'Realizar testes de integração entre os módulos X e Y, documentar resultados.',
    status: 'pendente',
    responsibleId: '3',
    startDate: new Date('2023-06-20'),
    endDate: new Date('2023-07-05'),
    companyId: '1',
    clientId: '3',
    requesterId: '4',
    attachments: [],
    notes: [],
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date('2023-06-20')
  },
  {
    id: '4',
    subject: 'Documento:',
    description: 'Criar documentação de API para o novo módulo',
    status: 'pendente',
    responsibleId: '4',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-06-15'),
    companyId: '1',
    clientId: '4',
    requesterId: '3',
    attachments: [],
    notes: [],
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01')
  }
];
