import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Company } from "@/lib/types"
import { UseFormReturn } from "react-hook-form"
import { useEffect, useState } from "react"
import { ensureSupabaseCompanyExists } from "@/hooks/client/supabase/company-operations"
import { toast } from "sonner"

interface CompanySelectorProps {
  form: UseFormReturn<any>
  companies: Company[]
  selectedCompanyId: string
  setSelectedCompanyId: (value: string) => void
}

export const CompanySelector = ({ 
  form, 
  companies, 
  selectedCompanyId, 
  setSelectedCompanyId 
}: CompanySelectorProps) => {
  const [syncing, setSyncing] = useState(false);
  
  // Garantir que o valor do formulário seja consistente com o selectedCompanyId
  useEffect(() => {
    if (selectedCompanyId && (!form.getValues("companyId") || form.getValues("companyId") !== selectedCompanyId)) {
      form.setValue("companyId", selectedCompanyId);

      // Encontrar e definir o nome da empresa
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany) {
        console.log("Definindo companyName para:", selectedCompany.name);
        form.setValue("companyName", selectedCompany.name);
        
        // Sincronizar empresa com Supabase quando selecionada
        const syncCompany = async () => {
          try {
            setSyncing(true);
            await ensureSupabaseCompanyExists({
              id: selectedCompany.id,
              name: selectedCompany.name
            });
            setSyncing(false);
          } catch (error) {
            console.error("Erro ao sincronizar empresa com Supabase:", error);
            setSyncing(false);
            toast.error("Erro ao sincronizar empresa", {
              description: "Não foi possível sincronizar a empresa com o banco de dados."
            });
          }
        };
        
        syncCompany();
      }
    }
  }, [selectedCompanyId, form, companies]);

  // Garantir que o formulário tenha um valor de empresa válido quando as empresas forem carregadas
  useEffect(() => {
    if (companies.length > 0 && !form.getValues("companyId")) {
      // Se não temos uma empresa selecionada, usar a primeira da lista
      const defaultCompanyId = companies[0].id;
      form.setValue("companyId", defaultCompanyId);
      
      // Definir o nome da empresa padrão
      const defaultCompany = companies.find(c => c.id === defaultCompanyId);
      if (defaultCompany) {
        console.log("Definindo companyName padrão para:", defaultCompany.name);
        form.setValue("companyName", defaultCompany.name);
        
        // Sincronizar empresa padrão com Supabase
        const syncCompany = async () => {
          try {
            setSyncing(true);
            await ensureSupabaseCompanyExists({
              id: defaultCompany.id,
              name: defaultCompany.name
            });
            setSyncing(false);
          } catch (error) {
            console.error("Erro ao sincronizar empresa padrão com Supabase:", error);
            setSyncing(false);
            toast.error("Erro ao sincronizar empresa", {
              description: "Não foi possível sincronizar a empresa com o banco de dados."
            });
          }
        };
        
        syncCompany();
      }
      
      setSelectedCompanyId(defaultCompanyId);
    }
  }, [companies, form, setSelectedCompanyId]);

  return (
    <FormField
      control={form.control}
      name="companyId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Empresa</FormLabel>
          <Select
            onValueChange={async (value) => {
              console.log("Empresa selecionada:", value);
              
              // Atualizar formulário com o ID da empresa
              field.onChange(value);
              setSelectedCompanyId(value);
              
              // Encontrar e definir o nome da empresa
              const selectedCompany = companies.find(c => c.id === value);
              if (selectedCompany) {
                console.log("Atualizando companyName para:", selectedCompany.name);
                form.setValue("companyName", selectedCompany.name);
                
                // Sincronizar empresa com Supabase quando selecionada
                try {
                  setSyncing(true);
                  await ensureSupabaseCompanyExists({
                    id: selectedCompany.id,
                    name: selectedCompany.name
                  });
                  setSyncing(false);
                  toast.success("Empresa sincronizada", {
                    description: "Empresa sincronizada com o banco de dados."
                  });
                } catch (error) {
                  console.error("Erro ao sincronizar empresa com Supabase:", error);
                  setSyncing(false);
                  toast.error("Erro ao sincronizar empresa", {
                    description: "Não foi possível sincronizar a empresa com o banco de dados."
                  });
                }
              }
              
              form.trigger("companyId");
            }}
            defaultValue={field.value}
            value={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {companies.length === 0 ? (
                <SelectItem value="no_companies_available" disabled>
                  Nenhuma empresa disponível
                </SelectItem>
              ) : (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
