
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import Workflow from '@/components/Workflow';
import WorkflowReport from '@/components/WorkflowReport';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { FileText, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WorkflowPage = () => {
  const { company } = useCompany();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("workflow");

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow de Ações</h1>
        <div className="mt-4 sm:mt-0">
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
        <WorkflowReport />
      )}
    </div>
  );
};

export default WorkflowPage;
