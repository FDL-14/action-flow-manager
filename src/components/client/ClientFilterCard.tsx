
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClientFilterCardProps {
  companies: Company[];
  selectedCompanyId?: string;
  onCompanySelect: (value: string) => void;
}

export const ClientFilterCard = ({
  companies,
  selectedCompanyId,
  onCompanySelect
}: ClientFilterCardProps) => {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <h3 className="text-lg font-medium">Filtrar por empresa</h3>
          <p className="text-sm text-gray-500">
            Selecione uma empresa para ver seus clientes
          </p>
        </div>
        <Select 
          value={selectedCompanyId} 
          onValueChange={onCompanySelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
            {companies.length === 0 && (
              <SelectItem value="no_companies" disabled>
                Nenhuma empresa disponível
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
