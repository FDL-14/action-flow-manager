
import { useCompany } from '@/contexts/CompanyContext';
import Workflow from '@/components/Workflow';
import { useIsMobile } from '@/hooks/use-mobile';

const WorkflowPage = () => {
  const { company } = useCompany();
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow de Ações</h1>
      </div>

      <div className={`bg-white rounded-lg shadow-sm ${isMobile ? 'overflow-x-auto' : ''}`}>
        <div className={isMobile ? 'min-w-[800px]' : ''}>
          <Workflow />
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
