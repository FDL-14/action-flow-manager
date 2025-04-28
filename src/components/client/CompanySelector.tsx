
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Company } from "@/lib/types"
import { UseFormReturn } from "react-hook-form"
import { useEffect } from "react"

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
  // Garantir que o valor do formulário seja consistente com o selectedCompanyId
  useEffect(() => {
    if (selectedCompanyId && (!form.getValues("companyId") || form.getValues("companyId") !== selectedCompanyId)) {
      form.setValue("companyId", selectedCompanyId);
    }
  }, [selectedCompanyId, form]);

  // Garantir que o formulário tenha um valor de empresa válido quando as empresas forem carregadas
  useEffect(() => {
    if (companies.length > 0 && !form.getValues("companyId")) {
      const defaultCompanyId = companies[0].id;
      form.setValue("companyId", defaultCompanyId);
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
            onValueChange={(value) => {
              console.log("Empresa selecionada:", value);
              setSelectedCompanyId(value);
              field.onChange(value);
              form.trigger("companyId");
            }}
            defaultValue={field.value || selectedCompanyId}
            value={field.value || selectedCompanyId}
          >
            <FormControl>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white min-w-[240px] max-h-[300px] overflow-y-auto z-50">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} (ID: {company.id})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no_companies" disabled>
                  Nenhuma empresa disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
