
import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Plus, UserX, Users, UserRound, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Responsible } from '@/lib/types';
import ResponsibleForm from '@/components/ResponsibleForm';
import ResponsibleList from '@/components/ResponsibleList';
import { Badge } from '@/components/ui/badge';

const ResponsiblesPage = () => {
  const { responsibles } = useCompany();
  const [showResponsibleForm, setShowResponsibleForm] = useState(false);
  const [editingResponsible, setEditingResponsible] = useState<Responsible | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'responsible' | 'requester' | 'system'>('all');
  const [visibleResponsibles, setVisibleResponsibles] = useState<Responsible[]>([]);
  
  useEffect(() => {
    let filtered = [...responsibles];
    
    switch (activeTab) {
      case 'responsible':
        filtered = filtered.filter(r => r.type === 'responsible' || !r.type);
        break;
      case 'requester':
        filtered = filtered.filter(r => r.type === 'requester');
        break;
      case 'system':
        filtered = filtered.filter(r => r.isSystemUser || r.userId);
        break;
      default:
        // All responsibles are shown
        break;
    }
    
    setVisibleResponsibles(filtered);
  }, [responsibles, activeTab]);
  
  const handleAddClick = (type?: 'responsible' | 'requester') => {
    setEditingResponsible(null);
    if (type) {
      setShowResponsibleForm(true);
    } else {
      setShowResponsibleForm(true);
    }
  };

  const handleEditResponsible = (responsible: Responsible) => {
    setEditingResponsible(responsible);
    setShowResponsibleForm(true);
  };

  const handleCloseForm = () => {
    setShowResponsibleForm(false);
    setEditingResponsible(null);
  };

  const systemUsers = responsibles.filter(r => r.isSystemUser || r.userId).length;
  const responsiblesCount = responsibles.filter(r => r.type === 'responsible' || !r.type).length;
  const requestersCount = responsibles.filter(r => r.type === 'requester').length;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Responsáveis/Solicitantes</h1>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => handleAddClick()}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Responsável/Solicitante
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'all' | 'responsible' | 'requester' | 'system')}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Todos</span>
              <Badge variant="secondary" className="ml-1">{responsibles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="responsible" className="flex items-center gap-1">
              <UserRound className="h-4 w-4" />
              <span>Responsáveis</span>
              <Badge variant="secondary" className="ml-1">{responsiblesCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requester" className="flex items-center gap-1">
              <UserX className="h-4 w-4" />
              <span>Solicitantes</span>
              <Badge variant="secondary" className="ml-1">{requestersCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Usuários do Sistema</span>
              <Badge variant="secondary" className="ml-1">{systemUsers}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <h2 className="text-xl font-semibold mb-2">
          Lista de {activeTab === 'responsible' ? 'Responsáveis' : 
                   activeTab === 'requester' ? 'Solicitantes' : 
                   activeTab === 'system' ? 'Usuários do Sistema' : 
                   'Responsáveis/Solicitantes'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {activeTab === 'system' ? 
            'Usuários do sistema cadastrados automaticamente como responsáveis e solicitantes.' : 
            'Gerenciar responsáveis/solicitantes para atribuição de ações.'}
        </p>
      </div>

      <ResponsibleList 
        responsibles={visibleResponsibles}
        onEdit={handleEditResponsible}
      />

      <ResponsibleForm
        open={showResponsibleForm}
        onOpenChange={setShowResponsibleForm}
        initialData={editingResponsible}
        isNewResponsible={!editingResponsible}
      />
    </div>
  );
};

export default ResponsiblesPage;
