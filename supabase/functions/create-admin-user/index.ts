
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://tsjdsbxgottssqqlzfxl.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada')
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // You can optionally parse request data but we'll use hardcoded values for simplicity
    const cpf = '80243088191'
    const email = `${cpf}@exemplo.com`
    const password = '@54321'
    const name = 'Administrador Master'

    // Verificar se já existe um usuário com este CPF
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (profileQueryError) {
      console.error('Erro ao verificar perfil existente:', profileQueryError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao verificar se o usuário já existe: ' + profileQueryError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (existingProfile) {
      console.log("Usuário com este CPF já existe");
      
      // Vamos garantir que o usuário existente tenha a função 'master'
      const { error: roleUpdateError } = await supabase
        .from('profiles')
        .update({
          role: 'master'
        })
        .eq('cpf', cpf);
        
      if (roleUpdateError) {
        console.error('Erro ao atualizar função do usuário:', roleUpdateError);
      }
      
      // Vamos garantir que o usuário existente tenha todas as permissões
      const { data: existingPermissions, error: permissionQueryError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', existingProfile.id)
        .maybeSingle();
        
      if (permissionQueryError) {
        console.error('Erro ao verificar permissões existentes:', permissionQueryError);
      }
      
      if (existingPermissions) {
        // Atualizar permissões existentes
        const { error: permUpdateError } = await supabase
          .from('user_permissions')
          .update({
            can_create: true,
            can_edit: true,
            can_delete: true,
            can_mark_complete: true,
            can_mark_delayed: true,
            can_add_notes: true,
            can_view_reports: true,
            view_all_actions: true,
            can_edit_user: true,
            can_edit_action: true,
            can_edit_client: true,
            can_delete_client: true,
            can_edit_company: true,
            can_delete_company: true,
            view_only_assigned_actions: false
          })
          .eq('user_id', existingProfile.id);
          
        if (permUpdateError) {
          console.error('Erro ao atualizar permissões:', permUpdateError);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuário com este CPF já existe. Use CPF: 80243088191 e senha: @54321 para fazer login. Permissões atualizadas para Administrador Master.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        cpf,
      },
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          message: authError.message || 'Erro ao criar usuário',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Falha ao criar usuário',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Atualizar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name,
        cpf,
        email,
        role: 'master',
        company_ids: ['1'],
        client_ids: [],
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Perfil criado, mas falha ao atualizar dados: ' + profileError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Adicionar permissões do usuário
    const permissionsData = {
      user_id: authData.user.id,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_mark_complete: true,
      can_mark_delayed: true,
      can_add_notes: true,
      can_view_reports: true,
      view_all_actions: true,
      can_edit_user: true,
      can_edit_action: true,
      can_edit_client: true,
      can_delete_client: true,
      can_edit_company: true,
      can_delete_company: true,
      view_only_assigned_actions: false,
    };

    const { error: permissionsError } = await supabase
      .from('user_permissions')
      .insert(permissionsData);

    if (permissionsError) {
      console.error('Erro ao adicionar permissões:', permissionsError);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuário criado, mas falha ao definir permissões: ' + permissionsError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário administrador criado com sucesso. Use CPF: 80243088191 e senha: @54321 para fazer login',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Erro ao criar usuário administrador',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
