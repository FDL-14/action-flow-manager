
import { useCompany } from '@/contexts/CompanyContext';
import Workflow from '@/components/Workflow';

const WorkflowPage = () => {
  const { company } = useCompany();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          {company?.logo && (
            <img 
              src={company.logo} 
              alt={`${company.name} Logo`} 
              className="h-10 mr-3" 
            />
          )}
          <h1 className="text-2xl font-bold">Workflow de Ações</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Workflow />
      </div>
    </div>
  );
};

export default WorkflowPage;
