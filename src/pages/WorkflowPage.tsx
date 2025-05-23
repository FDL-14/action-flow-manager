
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import Workflow from '@/components/Workflow';
import WorkflowReport from '@/components/WorkflowReport';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { FileText, BarChart2, Plus, KanbanSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActionForm from '@/components/ActionForm';
import { NotificationCenter } from '@/components/NotificationCenter';
import Kanban from '@/components/Kanban';
import { Action } from '@/lib/types';
import ActionViewKanban from '@/components/ActionViewKanban';

const WorkflowPage = () => {
  const { company } = useCompany();
  const { actions } = useActions();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("workflow");
  const [showActionForm, setShowActionForm] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);

  const handleActionClick = (action: Action) => {
    setViewingAction(action);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow de Ações/Tarefas</h1>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowActionForm(true)} 
              variant="default" 
              size="sm" 
              className="mb-2 sm:mb-0 sm:mr-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova Ação/Tarefa
            </Button>
            
            <NotificationCenter />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="workflow" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-1">
                <KanbanSquare className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Relatório</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === "workflow" ? (
        <div className={`bg-white rounded-lg shadow-sm ${isMobile ? 'overflow-x-auto' : ''}`}>
          <div className={isMobile ? 'min-w-[800px]' : ''}>
            <Workflow />
          </div>
        </div>
      ) : activeTab === "kanban" ? (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Kanban 
            actions={actions} 
            readOnly={true}
            onActionClick={handleActionClick}
            title="Kanban de Ações/Tarefas"
            description="Visualize as ações/tarefas por status (somente visualização)"
          />
        </div>
      ) : (
        <WorkflowReport onClose={() => setActiveTab("workflow")} />
      )}

      <ActionForm 
        open={showActionForm} 
        onOpenChange={setShowActionForm} 
      />

      {viewingAction && (
        <ActionViewKanban
          action={viewingAction}
          open={true}
          onClose={() => setViewingAction(null)}
        />
      )}
    </div>
  );
};

export default WorkflowPage;
