
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import Workflow from '@/components/Workflow';
import WorkflowReport from '@/components/WorkflowReport';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { FileText, BarChart2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActionForm from '@/components/ActionForm';
import { NotificationCenter } from '@/components/NotificationCenter';

const WorkflowPage = () => {
  const { company } = useCompany();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("workflow");
  const [showActionForm, setShowActionForm] = useState(false);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow de Ações</h1>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowActionForm(true)} 
              variant="default" 
              size="sm" 
              className="mb-2 sm:mb-0 sm:mr-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova Ação
            </Button>
            
            <NotificationCenter />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="workflow" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Workflow</span>
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
      ) : (
        <WorkflowReport onClose={() => setActiveTab("workflow")} />
      )}

      <ActionForm 
        open={showActionForm} 
        onOpenChange={setShowActionForm} 
      />
    </div>
  );
};

export default WorkflowPage;
