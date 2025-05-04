
import { useState, useEffect } from 'react';
import { Responsible } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getAllResponsibles, 
  ensureResponsibleExists 
} from './client/supabase/responsible-operations';
import { ensureSupabaseCompanyExists } from './client/supabase/company-operations';

export const useResponsibleOperations = () => {
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch responsibles from Supabase
  useEffect(() => {
    const fetchResponsibles = async () => {
      setLoading(true);
      try {
        console.log("Buscando responsáveis do Supabase...");
        const responsiblesData = await getAllResponsibles();
        
        if (responsiblesData) {
          const formattedResponsibles: Responsible[] = await Promise.all(
            responsiblesData.map(async (resp) => {
              // Get company name if it exists
              let companyName = undefined;
              if (resp.company_id) {
                try {
                  const { data } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', resp.company_id)
                    .single();
                  
                  companyName = data?.name;
                } catch (error) {
                  console.error(`Erro ao buscar nome da empresa ${resp.company_id}:`, error);
                }
              }
              
              return {
                id: resp.id,
                name: resp.name,
                email: resp.email || '',
                phone: resp.phone || '',
                department: '',
                role: 'responsible',
                companyId: resp.company_id || '',
                companyName: companyName || '',
                createdAt: new Date(resp.created_at),
                updatedAt: new Date(resp.updated_at)
              };
            })
          );
          
          console.log(`${formattedResponsibles.length} responsáveis carregados do Supabase`);
          setResponsibles(formattedResponsibles);
        }
      } catch (error) {
        console.error("Erro ao buscar responsáveis:", error);
        toast.error("Erro ao carregar responsáveis", { 
          description: "Não foi possível carregar a lista de responsáveis."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResponsibles();
    
    // Set up real-time subscription for responsibles
    const responsiblesSubscription = supabase
      .channel('responsibles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'responsibles' }, 
        fetchResponsibles)
      .subscribe();

    return () => {
      supabase.removeChannel(responsiblesSubscription);
    };
  }, []);

  // Add a new responsible
  const addResponsible = async (responsible: Omit<Responsible, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (!responsible.name.trim()) {
        toast.error("Nome obrigatório", { description: "Informe o nome do responsável." });
        return null;
      }
      
      // Make sure the company exists
      const companyId = await ensureSupabaseCompanyExists({
        id: responsible.companyId,
        name: responsible.companyName || 'Empresa do responsável'
      });
      
      if (!companyId) {
        toast.error("Erro de empresa", { 
          description: "Não foi possível encontrar ou criar a empresa associada."
        });
        return null;
      }
      
      // Create the responsible in Supabase
      const { data, error } = await supabase
        .from('responsibles')
        .insert({
          name: responsible.name,
          email: responsible.email || null,
          phone: responsible.phone || null,
          company_id: companyId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newResponsible: Responsible = {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        department: '',
        role: 'responsible',
        companyId: data.company_id || '',
        companyName: responsible.companyName || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setResponsibles([...responsibles, newResponsible]);
      toast.success("Responsável adicionado", { 
        description: "Responsável adicionado com sucesso."
      });
      
      return newResponsible;
    } catch (error: any) {
      console.error('Erro ao adicionar responsável:', error);
      toast.error("Erro ao adicionar", { description: error.message });
      return null;
    }
  };

  // Update an existing responsible
  const updateResponsible = async (responsible: Responsible) => {
    try {
      if (!responsible.name.trim()) {
        toast.error("Nome obrigatório", { description: "Informe o nome do responsável." });
        return false;
      }
      
      // Make sure the company exists
      const companyId = await ensureSupabaseCompanyExists({
        id: responsible.companyId,
        name: responsible.companyName || 'Empresa do responsável'
      });
      
      if (!companyId) {
        toast.error("Erro de empresa", { 
          description: "Não foi possível encontrar ou criar a empresa associada."
        });
        return false;
      }
      
      const { error } = await supabase
        .from('responsibles')
        .update({
          name: responsible.name,
          email: responsible.email || null,
          phone: responsible.phone || null,
          company_id: companyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', responsible.id);

      if (error) {
        throw error;
      }

      setResponsibles(prevResponsibles => 
        prevResponsibles.map(r => r.id === responsible.id ? {
          ...r,
          ...responsible,
          updatedAt: new Date()
        } : r)
      );
      
      toast.success("Responsável atualizado", { 
        description: "Responsável atualizado com sucesso."
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error("Erro ao atualizar", { description: error.message });
      return false;
    }
  };

  // Delete a responsible
  const deleteResponsible = async (id: string) => {
    try {
      const { error } = await supabase
        .from('responsibles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setResponsibles(prevResponsibles => 
        prevResponsibles.filter(responsible => responsible.id !== id)
      );
      
      toast.success("Responsável excluído", { 
        description: "Responsável excluído com sucesso."
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir responsável:', error);
      toast.error("Erro ao excluir", { description: error.message });
      return false;
    }
  };

  return {
    responsibles,
    loading,
    addResponsible,
    updateResponsible,
    deleteResponsible
  };
};
