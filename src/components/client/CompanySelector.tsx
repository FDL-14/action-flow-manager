
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Company } from "@/lib/types"
import { UseFormReturn } from "react-hook-form"
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
            value={selectedCompanyId || field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white min-w-[240px] max-h-[300px] overflow-y-auto z-50">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
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
