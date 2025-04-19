
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Match the FormValues type from CompanyForm where name is required
interface FormValues {
  name: string;
  address?: string;
  cnpj?: string;
  phone?: string;
}

interface CompanyFormFieldsProps {
  form: UseFormReturn<FormValues>;
}

const CompanyFormFields: React.FC<CompanyFormFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Minha Empresa Ltda" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input placeholder="Ex: (00) 0000-0000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default CompanyFormFields;
