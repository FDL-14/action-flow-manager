
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
    console.log("Iniciando função create-master-user");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://tsjdsbxgottssqqlzfxl.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseServiceKey) {
      console.error("Chave de serviço Supabase não configurada");
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada')
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, password, name, cpf } = await req.json()

    console.log("Dados recebidos:", { email, name, cpf });

    try {
      // Verificar se já existe um usuário com este email
      const { data: existingUser, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (queryError) {
        console.error('Erro ao verificar usuário existente:', queryError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Erro ao verificar se o usuário já existe: ' + queryError.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      if (existingUser) {
        console.log("Usuário master já existe");
        return new Response(
          JSON.stringify({
            success: false,
            message: 'O usuário master já existe no sistema',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      console.log("Criando usuário no Auth");
      
      // Criar usuário no Auth com senha @54321
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          cpf,
        },
      })

      if (authError) {
        console.error('Erro ao criar usuário master:', authError)
        return new Response(
          JSON.stringify({
            success: false,
            message: authError.message || 'Erro ao criar usuário master',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      if (!authData.user) {
        console.error("Falha ao criar usuário");
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Falha ao criar usuário master',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      console.log("Usuário criado no Auth, atualizando perfil");
      
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
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Perfil criado, mas falha ao atualizar dados: ' + profileError.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      console.log("Perfil atualizado, adicionando permissões");
      
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
      }

      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsData)

      if (permissionsError) {
        console.error('Erro ao adicionar permissões:', permissionsError)
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Usuário criado, mas falha ao definir permissões: ' + permissionsError.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      console.log("Usuário master criado com sucesso");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'O usuário master foi criado com sucesso',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (innerError) {
      console.error('Erro interno:', innerError);
      return new Response(
        JSON.stringify({
          success: false,
          message: innerError.message || 'Erro interno ao criar usuário master',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  } catch (error) {
    console.error('Erro ao criar usuário master:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Erro ao criar usuário master',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
