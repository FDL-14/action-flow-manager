
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface ClientAdditionalInfoProps {
  form: UseFormReturn<any>
}

export const ClientAdditionalInfo = ({ form }: ClientAdditionalInfoProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Rua Exemplo, 123" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="cnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <Input placeholder="Ex: 00.000.000/0001-00" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
