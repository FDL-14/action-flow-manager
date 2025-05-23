export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_attachments: {
        Row: {
          action_id: string | null
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_attachments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      action_notes: {
        Row: {
          action_id: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_deleted: boolean | null
        }
        Insert: {
          action_id?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_deleted?: boolean | null
        }
        Update: {
          action_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_deleted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "action_notes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      action_stages: {
        Row: {
          action_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_sequential: boolean | null
          order_index: number
          parent_stage_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_sequential?: boolean | null
          order_index?: number
          parent_stage_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_sequential?: boolean | null
          order_index?: number
          parent_stage_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_stages_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_stages_parent_stage_id_fkey"
            columns: ["parent_stage_id"]
            isOneToOne: false
            referencedRelation: "action_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          approval_required: boolean | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          approver_id: string | null
          client_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_personal: boolean | null
          is_subtask: boolean | null
          notes: Json | null
          order_index: number | null
          parent_action_id: string | null
          personal_reminder_settings: Json | null
          priority: string | null
          requester_id: string | null
          responsible_id: string | null
          stage_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_required?: boolean | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          approver_id?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_personal?: boolean | null
          is_subtask?: boolean | null
          notes?: Json | null
          order_index?: number | null
          parent_action_id?: string | null
          personal_reminder_settings?: Json | null
          priority?: string | null
          requester_id?: string | null
          responsible_id?: string | null
          stage_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_required?: boolean | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          approver_id?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_personal?: boolean | null
          is_subtask?: boolean | null
          notes?: Json | null
          order_index?: number | null
          parent_action_id?: string | null
          personal_reminder_settings?: Json | null
          priority?: string | null
          requester_id?: string | null
          responsible_id?: string | null
          stage_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_parent_action_id_fkey"
            columns: ["parent_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "responsibles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          document_id: string | null
          id: string
          is_internal: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_internal?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_internal?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          id?: string
          logo?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies_units: {
        Row: {
          address: string | null
          city: string | null
          cnae_description: string | null
          cnae_main: string | null
          cnpj: string | null
          complement: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          district: string | null
          fantasy_name: string | null
          group_client_id: string
          id: string
          inscription_type: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          number: string | null
          phone: string | null
          social_name: string | null
          state: string | null
          street: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnae_description?: string | null
          cnae_main?: string | null
          cnpj?: string | null
          complement?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          district?: string | null
          fantasy_name?: string | null
          group_client_id: string
          id?: string
          inscription_type?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          number?: string | null
          phone?: string | null
          social_name?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnae_description?: string | null
          cnae_main?: string | null
          cnpj?: string | null
          complement?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          district?: string | null
          fantasy_name?: string | null
          group_client_id?: string
          id?: string
          inscription_type?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          number?: string | null
          phone?: string | null
          social_name?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_units_group_client_id_fkey"
            columns: ["group_client_id"]
            isOneToOne: false
            referencedRelation: "groups_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_section_locks: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          lock_when_signed: boolean | null
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          lock_when_signed?: boolean | null
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          lock_when_signed?: boolean | null
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_section_locks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          description: string | null
          document_type_id: string | null
          id: string
          is_deleted: boolean | null
          is_template: boolean | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: Json
          description?: string | null
          document_type_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_template?: boolean | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          description?: string | null
          document_type_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_template?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      groups_clients: {
        Row: {
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notificacoes_internas: {
        Row: {
          action_data: Json | null
          atualizado_em: string | null
          conteudo: string
          criado_em: string | null
          destinatario_id: string
          id: string
          lida: boolean | null
          notification_type: string | null
          referencia_id: string | null
          remetente_id: string | null
          scheduled_for: string | null
          tipo_referencia: string | null
          titulo: string
        }
        Insert: {
          action_data?: Json | null
          atualizado_em?: string | null
          conteudo: string
          criado_em?: string | null
          destinatario_id: string
          id?: string
          lida?: boolean | null
          notification_type?: string | null
          referencia_id?: string | null
          remetente_id?: string | null
          scheduled_for?: string | null
          tipo_referencia?: string | null
          titulo: string
        }
        Update: {
          action_data?: Json | null
          atualizado_em?: string | null
          conteudo?: string
          criado_em?: string | null
          destinatario_id?: string
          id?: string
          lida?: boolean | null
          notification_type?: string | null
          referencia_id?: string | null
          remetente_id?: string | null
          scheduled_for?: string | null
          tipo_referencia?: string | null
          titulo?: string
        }
        Relationships: []
      }
      persons_employees: {
        Row: {
          address: string | null
          admission_date: string | null
          birth_date: string | null
          cbo: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          dismissal_date: string | null
          email: string | null
          esocial_registration: string | null
          gender: string | null
          id: string
          internal_registration: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          nis: string | null
          phone: string | null
          position_id: string | null
          position_role_id: string
          rg: string | null
          rg_state: string | null
          sector_department_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          birth_date?: string | null
          cbo?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissal_date?: string | null
          email?: string | null
          esocial_registration?: string | null
          gender?: string | null
          id?: string
          internal_registration?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          nis?: string | null
          phone?: string | null
          position_id?: string | null
          position_role_id: string
          rg?: string | null
          rg_state?: string | null
          sector_department_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          birth_date?: string | null
          cbo?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissal_date?: string | null
          email?: string | null
          esocial_registration?: string | null
          gender?: string | null
          id?: string
          internal_registration?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          nis?: string | null
          phone?: string | null
          position_id?: string | null
          position_role_id?: string
          rg?: string | null
          rg_state?: string | null
          sector_department_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_employees_position_role_id_fkey"
            columns: ["position_role_id"]
            isOneToOne: false
            referencedRelation: "positions_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_employees_sector_department_id_fkey"
            columns: ["sector_department_id"]
            isOneToOne: false
            referencedRelation: "sectors_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      positions_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          name: string
          sector_department_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          sector_department_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          sector_department_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_roles_sector_department_id_fkey"
            columns: ["sector_department_id"]
            isOneToOne: false
            referencedRelation: "sectors_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_ids: string[] | null
          company_ids: string[] | null
          cpf: string | null
          created_at: string | null
          email: string | null
          face_image: string | null
          id: string
          is_admin: boolean | null
          is_face_registered: boolean | null
          is_master: boolean | null
          name: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_ids?: string[] | null
          company_ids?: string[] | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          face_image?: string | null
          id: string
          is_admin?: boolean | null
          is_face_registered?: boolean | null
          is_master?: boolean | null
          name: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_ids?: string[] | null
          company_ids?: string[] | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          face_image?: string | null
          id?: string
          is_admin?: boolean | null
          is_face_registered?: boolean | null
          is_master?: boolean | null
          name?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      responsibles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsibles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors_departments: {
        Row: {
          area: number | null
          building_type: string | null
          ceiling_height: number | null
          closure_type: string | null
          company_unit_id: string
          cover_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          floor_type: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          lighting_type: string | null
          name: string
          updated_at: string | null
          ventilation_type: string | null
        }
        Insert: {
          area?: number | null
          building_type?: string | null
          ceiling_height?: number | null
          closure_type?: string | null
          company_unit_id: string
          cover_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_type?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          lighting_type?: string | null
          name: string
          updated_at?: string | null
          ventilation_type?: string | null
        }
        Update: {
          area?: number | null
          building_type?: string | null
          ceiling_height?: number | null
          closure_type?: string | null
          company_unit_id?: string
          cover_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_type?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          lighting_type?: string | null
          name?: string
          updated_at?: string | null
          ventilation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sectors_departments_company_unit_id_fkey"
            columns: ["company_unit_id"]
            isOneToOne: false
            referencedRelation: "companies_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          internal_enabled: boolean | null
          reminder_before_hours: number | null
          reminder_frequency_hours: number | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          internal_enabled?: boolean | null
          reminder_before_hours?: number | null
          reminder_frequency_hours?: number | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          internal_enabled?: boolean | null
          reminder_before_hours?: number | null
          reminder_frequency_hours?: number | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_add_notes: boolean | null
          can_create: boolean | null
          can_create_clients_limited: boolean | null
          can_create_companies: boolean | null
          can_create_stages: boolean | null
          can_create_users_admin: boolean | null
          can_create_users_limited: boolean | null
          can_delete: boolean | null
          can_delete_actions_limited: boolean | null
          can_delete_client: boolean | null
          can_delete_company: boolean | null
          can_delete_stages: boolean | null
          can_download_reports_limited: boolean | null
          can_edit: boolean | null
          can_edit_action: boolean | null
          can_edit_client: boolean | null
          can_edit_company: boolean | null
          can_edit_document_type: boolean | null
          can_edit_user: boolean | null
          can_mark_complete: boolean | null
          can_mark_delayed: boolean | null
          can_view_reports: boolean | null
          id: string
          user_id: string | null
          view_all_actions: boolean | null
          view_only_assigned_actions: boolean | null
        }
        Insert: {
          can_add_notes?: boolean | null
          can_create?: boolean | null
          can_create_clients_limited?: boolean | null
          can_create_companies?: boolean | null
          can_create_stages?: boolean | null
          can_create_users_admin?: boolean | null
          can_create_users_limited?: boolean | null
          can_delete?: boolean | null
          can_delete_actions_limited?: boolean | null
          can_delete_client?: boolean | null
          can_delete_company?: boolean | null
          can_delete_stages?: boolean | null
          can_download_reports_limited?: boolean | null
          can_edit?: boolean | null
          can_edit_action?: boolean | null
          can_edit_client?: boolean | null
          can_edit_company?: boolean | null
          can_edit_document_type?: boolean | null
          can_edit_user?: boolean | null
          can_mark_complete?: boolean | null
          can_mark_delayed?: boolean | null
          can_view_reports?: boolean | null
          id?: string
          user_id?: string | null
          view_all_actions?: boolean | null
          view_only_assigned_actions?: boolean | null
        }
        Update: {
          can_add_notes?: boolean | null
          can_create?: boolean | null
          can_create_clients_limited?: boolean | null
          can_create_companies?: boolean | null
          can_create_stages?: boolean | null
          can_create_users_admin?: boolean | null
          can_create_users_limited?: boolean | null
          can_delete?: boolean | null
          can_delete_actions_limited?: boolean | null
          can_delete_client?: boolean | null
          can_delete_company?: boolean | null
          can_delete_stages?: boolean | null
          can_download_reports_limited?: boolean | null
          can_edit?: boolean | null
          can_edit_action?: boolean | null
          can_edit_client?: boolean | null
          can_edit_company?: boolean | null
          can_edit_document_type?: boolean | null
          can_edit_user?: boolean | null
          can_mark_complete?: boolean | null
          can_mark_delayed?: boolean | null
          can_view_reports?: boolean | null
          id?: string
          user_id?: string | null
          view_all_actions?: boolean | null
          view_only_assigned_actions?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { user_id: string }
        Returns: {
          is_admin: boolean
          is_master: boolean
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: {
          is_admin: boolean
          is_master: boolean
        }[]
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_master_user: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
