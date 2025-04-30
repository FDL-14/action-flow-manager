
import { useState, useEffect } from 'react';
import { Responsible, User } from '@/lib/types';
import { mockResponsibles } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';

export const useResponsibleOperations = () => {
  const [responsibles, setResponsibles] = useState<Responsible[]>(mockResponsibles);
  const { users } = useAuth();

  // Efeito para registrar automaticamente todos os usuários como responsáveis e solicitantes
  useEffect(() => {
    if (users && users.length > 0) {
      const autoRegisterUsers = () => {
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
        usersToRegister.forEach(user => {
          // Criar responsável a partir do usuário
          const responsible: Responsible = {
            id: `resp-${user.id}`,
            name: user.name,
            email: user.email,
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
          
          // Criar solicitante a partir do mesmo usuário
          const requester: Responsible = {
            id: `req-${user.id}`,
            name: user.name,
            email: user.email,
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
          
          newResponsibles.push(responsible, requester);
        });
        
        if (newResponsibles.length > 0) {
          setResponsibles(prevResponsibles => [...prevResponsibles, ...newResponsibles]);
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

  const addResponsible = (responsibleData: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!responsibleData) return;
    
    const newResponsible: Responsible = {
      id: Date.now().toString(),
      companyId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...responsibleData
    };
    
    setResponsibles([...responsibles, newResponsible]);
  };

  const updateResponsible = (updatedResponsible: Responsible) => {
    const updatedResponsibles = responsibles.map(r => 
      r.id === updatedResponsible.id ? { ...updatedResponsible, updatedAt: new Date() } : r
    );
    
    setResponsibles(updatedResponsibles);
  };

  const deleteResponsible = (id: string) => {
    setResponsibles(responsibles.filter(r => r.id !== id));
  };

  return {
    responsibles,
    addResponsible,
    updateResponsible,
    deleteResponsible
  };
};
