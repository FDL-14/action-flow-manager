
import { supabase, retryOperation } from '@/integrations/supabase/client';
import { isValidUUID, logDebug } from './utils';

/**
 * Checks if a responsible exists in Supabase by ID
 */
export const checkResponsibleExists = async (responsibleId: string): Promise<boolean> => {
  if (!responsibleId) return false;
  
  try {
    // Validate UUID format
    if (!isValidUUID(responsibleId)) {
      logDebug(`ID de responsável inválido: ${responsibleId}`);
      return false;
    }
    
    const { data, error } = await retryOperation(
      async () => await supabase
        .from('responsibles')
        .select('id')
        .eq('id', responsibleId)
        .maybeSingle(),
      3,
      500,
      'Check responsible exists'
    );
    
    if (error) {
      logDebug("Erro ao verificar responsável:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    logDebug("Erro ao verificar responsável:", error);
    return false;
  }
};

/**
 * Creates a responsible in Supabase if it doesn't exist
 */
export const ensureResponsibleExists = async (responsibleData: any): Promise<string | null> => {
  if (!responsibleData || !responsibleData.name) {
    logDebug("Dados de responsável inválidos");
    return null;
  }

  try {
    // If we have an ID, check if it exists
    if (responsibleData.id) {
      const exists = await checkResponsibleExists(responsibleData.id);
      if (exists) {
        return responsibleData.id;
      }
    }

    // Ensure we have a valid company_id before creating
    if (!responsibleData.companyId) {
      logDebug("companyId é obrigatório para criar um responsável");
      
      // Try to find a default company to use
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      if (!companies || companies.length === 0) {
        logDebug("Nenhuma empresa encontrada para associar ao responsável");
        return null;
      }
      
      responsibleData.companyId = companies[0].id;
      logDebug(`Usando empresa padrão para o responsável: ${responsibleData.companyId}`);
    }

    // Create the responsible
    const { data, error } = await retryOperation(
      async () => await supabase
        .from('responsibles')
        .insert({
          name: responsibleData.name,
          email: responsibleData.email || null,
          phone: responsibleData.phone || null,
          company_id: responsibleData.companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      3,
      500,
      'Create responsible'
    );
    
    if (error) {
      logDebug("Erro ao criar responsável:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    logDebug("Erro ao garantir existência do responsável:", error);
    return null;
  }
};

/**
 * Get a list of all responsibles
 */
export const getAllResponsibles = async () => {
  try {
    const { data, error } = await retryOperation(
      async () => await supabase
        .from('responsibles')
        .select('*')
        .order('name', { ascending: true }),
      3,
      500,
      'Get all responsibles'
    );
    
    if (error) {
      logDebug("Erro ao buscar responsáveis:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logDebug("Erro ao buscar responsáveis:", error);
    return [];
  }
};

/**
 * Sync local responsibles with Supabase
 */
export const syncResponsiblesToSupabase = async (responsibles: any[]) => {
  if (!responsibles || responsibles.length === 0) {
    return [];
  }

  const syncedResponsibles = [];
  for (const responsible of responsibles) {
    try {
      // Make sure the company exists
      const { ensureSupabaseCompanyExists } = await import('./company-operations');
      
      if (responsible.companyId) {
        const companyId = await ensureSupabaseCompanyExists({
          id: responsible.companyId,
          name: responsible.companyName || 'Empresa do responsável'
        });
        
        if (companyId) {
          responsible.companyId = companyId;
        }
      }
      
      const responsibleId = await ensureResponsibleExists(responsible);
      if (responsibleId) {
        syncedResponsibles.push({
          ...responsible,
          id: responsibleId
        });
      }
    } catch (error) {
      console.error(`Erro ao sincronizar responsável ${responsible.name}:`, error);
    }
  }
  
  return syncedResponsibles;
};
