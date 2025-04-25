
import { useState, useEffect } from 'react';
import { Responsible } from '@/lib/types';
import { mockResponsibles } from '@/lib/mock-data';

export const useResponsibleOperations = () => {
  const [responsibles, setResponsibles] = useState<Responsible[]>(mockResponsibles);

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
