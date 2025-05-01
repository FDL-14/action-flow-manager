
import { useState, useEffect } from 'react';
import { Responsible, User } from '@/lib/types';
import { mockResponsibles } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, retryOperation } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useResponsibleOperations = () => {
  const [responsibles, setResponsibles] = useState<Responsible[]>(mockResponsibles);
  const { users, user } = useAuth();

  // Initialize responsibles from Supabase
  useEffect(() => {
    const fetchResponsiblesFromSupabase = async () => {
      try {
        console.log('Buscando responsáveis do Supabase...');
        const { data, error } = await retryOperation(
          async () => await supabase
            .from('responsibles')
            .select('*')
            .order('name'),
          3, 
          500,
          'Fetch responsibles'
        );

        if (error) {
          console.error('Erro ao buscar responsáveis:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log(`${data.length} responsáveis encontrados no Supabase`);
          
          // Format the data to match our interface
          const formattedResponsibles: Responsible[] = data.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email || '',
            phone: r.phone || '',
            department: r.department || 'Não especificado',
            role: r.role || 'Responsável',
            type: 'responsible',
            companyId: r.company_id || '',
            clientIds: r.client_ids || [],
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
            userId: r.user_id || undefined,
            isSystemUser: !!r.user_id
          }));
          
          setResponsibles(formattedResponsibles);
          localStorage.setItem('responsibles', JSON.stringify(formattedResponsibles));
        } else {
          console.log('Nenhum responsável encontrado no Supabase, verificando localStorage...');
          const storedResponsibles = localStorage.getItem('responsibles');
          if (storedResponsibles) {
            const parsedResponsibles = JSON.parse(storedResponsibles);
            setResponsibles(parsedResponsibles);
          } else {
            setResponsibles([]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar responsáveis do Supabase:', error);
      }
    };

    fetchResponsiblesFromSupabase();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('public:responsibles')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'responsibles' 
      }, (payload) => {
        console.log('Alteração na tabela responsibles detectada:', payload);
        fetchResponsiblesFromSupabase();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Efeito para registrar automaticamente todos os usuários como responsáveis e solicitantes
  useEffect(() => {
    if (users && users.length > 0) {
      const autoRegisterUsers = async () => {
        try {
          // Criar lista de responsáveis e solicitantes a partir dos usuários
          const existingUserIds = responsibles
            .filter(r => r.userId)
            .map(r => r.userId);
            
          const usersToRegister = users.filter(
            user => !existingUserIds.includes(user.id)
          );
          
          if (usersToRegister.length === 0) return;

          console.log(`Auto-registrando ${usersToRegister.length} usuários como responsáveis e solicitantes`);
          
          const newResponsibles: Responsible[] = [];
          
          // Registrar cada usuário como responsável e solicitante
          for (const user of usersToRegister) {
            try {
              // Criar responsável a partir do usuário
              const responsible: Responsible = {
                id: `resp-${user.id}`,
                name: user.name,
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || 'Usuários do Sistema',
                role: 'Usuário do Sistema',
                type: 'responsible',
                companyId: user.companyIds ? user.companyIds[0] : '',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: user.id,
                isSystemUser: true
              };
              
              // Add to Supabase
              await retryOperation(
                async () => await supabase
                  .from('responsibles')
                  .upsert({
                    id: responsible.id,
                    name: responsible.name,
                    email: responsible.email,
                    phone: responsible.phone,
                    department: responsible.department,
                    role: responsible.role,
                    company_id: responsible.companyId,
                    created_at: responsible.createdAt.toISOString(),
                    updated_at: responsible.updatedAt.toISOString(),
                    user_id: responsible.userId
                  }),
                3,
                500,
                `Register responsible for ${user.name}`
              );
              
              // Criar solicitante a partir do mesmo usuário
              const requester: Responsible = {
                id: `req-${user.id}`,
                name: user.name,
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || 'Usuários do Sistema',
                role: 'Usuário do Sistema', 
                type: 'requester',
                companyId: user.companyIds ? user.companyIds[0] : '',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: user.id,
                isSystemUser: true
              };
              
              // Add to Supabase
              await retryOperation(
                async () => await supabase
                  .from('responsibles')
                  .upsert({
                    id: requester.id,
                    name: requester.name,
                    email: requester.email,
                    phone: requester.phone,
                    department: requester.department,
                    role: requester.role,
                    type: 'requester',
                    company_id: requester.companyId,
                    created_at: requester.createdAt.toISOString(),
                    updated_at: requester.updatedAt.toISOString(),
                    user_id: requester.userId
                  }),
                3,
                500,
                `Register requester for ${user.name}`
              );
              
              newResponsibles.push(responsible, requester);
            } catch (error) {
              console.error(`Erro ao registrar usuário ${user.name}:`, error);
            }
          }
          
          if (newResponsibles.length > 0) {
            setResponsibles(prevResponsibles => [...prevResponsibles, ...newResponsibles]);
          }
        } catch (error) {
          console.error("Erro ao registrar usuários como responsáveis/solicitantes:", error);
        }
      };
      
      autoRegisterUsers();
    }
  }, [users]);

  useEffect(() => {
    try {
      if (responsibles && responsibles.length > 0) {
        localStorage.setItem('responsibles', JSON.stringify(responsibles));
      }
    } catch (error) {
      console.error("Error saving responsibles:", error);
    }
  }, [responsibles]);

  const addResponsible = async (responsibleData: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!responsibleData) return;
    
    try {
      // Get current user's company if available
      let companyId = '';
      if (user && user.companyIds && user.companyIds.length > 0) {
        companyId = user.companyIds[0];
      }
      
      const newResponsible: Responsible = {
        id: Date.now().toString(),
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...responsibleData
      };
      
      // Add to Supabase
      const { data, error } = await retryOperation(
        async () => await supabase
          .from('responsibles')
          .insert({
            name: newResponsible.name,
            email: newResponsible.email,
            phone: newResponsible.phone || null,
            department: newResponsible.department || null,
            role: newResponsible.role || 'Responsável',
            type: newResponsible.type || 'responsible',
            company_id: companyId,
            user_id: newResponsible.userId || null,
            created_at: newResponsible.createdAt.toISOString(),
            updated_at: newResponsible.updatedAt.toISOString()
          })
          .select()
          .single(),
        3,
        500,
        'Add responsible'
      );
      
      if (error) {
        console.error('Erro ao adicionar responsável ao Supabase:', error);
        toast.error('Erro ao adicionar responsável', { 
          description: 'Houve um erro ao salvar os dados no banco de dados.'
        });
        return;
      }
      
      // Use the ID from Supabase
      const responsibleWithId: Responsible = {
        ...newResponsible,
        id: data.id
      };
      
      setResponsibles([...responsibles, responsibleWithId]);
      toast.success('Responsável adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error);
      toast.error('Erro ao adicionar responsável', { 
        description: 'Houve um erro ao processar a solicitação.'
      });
    }
  };

  const updateResponsible = async (updatedResponsible: Responsible) => {
    try {
      // Update in Supabase
      const { error } = await retryOperation(
        async () => await supabase
          .from('responsibles')
          .update({
            name: updatedResponsible.name,
            email: updatedResponsible.email,
            phone: updatedResponsible.phone || null,
            department: updatedResponsible.department || null,
            role: updatedResponsible.role || 'Responsável',
            type: updatedResponsible.type || 'responsible',
            company_id: updatedResponsible.companyId,
            client_ids: updatedResponsible.clientIds || null,
            user_id: updatedResponsible.userId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedResponsible.id),
        3,
        500,
        'Update responsible'
      );
      
      if (error) {
        console.error('Erro ao atualizar responsável no Supabase:', error);
        toast.error('Erro ao atualizar', { 
          description: 'Houve um erro ao salvar as alterações.'
        });
        return;
      }
      
      const updatedResponsibles = responsibles.map(r => 
        r.id === updatedResponsible.id ? { ...updatedResponsible, updatedAt: new Date() } : r
      );
      
      setResponsibles(updatedResponsibles);
      toast.success('Responsável atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar', { 
        description: 'Houve um erro ao processar a solicitação.'
      });
    }
  };

  const deleteResponsible = async (id: string) => {
    try {
      // Don't delete system users
      const responsible = responsibles.find(r => r.id === id);
      if (responsible?.isSystemUser) {
        toast.error('Operação não permitida', { 
          description: 'Não é possível excluir um usuário do sistema.'
        });
        return;
      }
      
      // Delete from Supabase
      const { error } = await retryOperation(
        async () => await supabase
          .from('responsibles')
          .delete()
          .eq('id', id),
        3,
        500,
        'Delete responsible'
      );
      
      if (error) {
        console.error('Erro ao excluir responsável do Supabase:', error);
        toast.error('Erro ao excluir', { 
          description: 'Houve um erro ao remover os dados.'
        });
        return;
      }
      
      setResponsibles(responsibles.filter(r => r.id !== id));
      toast.success('Responsável excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir responsável:', error);
      toast.error('Erro ao excluir', { 
        description: 'Houve um erro ao processar a solicitação.'
      });
    }
  };

  return {
    responsibles,
    addResponsible,
    updateResponsible,
    deleteResponsible
  };
};
