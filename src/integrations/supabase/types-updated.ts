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
      appointments: {
        Row: {
          id: string
          cliente_id: string
          funcionario_id: string
          servico_id: string
          data_hora: string
          status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
          motivo_cancelamento: string | null
          data_conclusao: string | null
          employee_id: string | null
          salao_id: string
        }
        Insert: {
          id?: string
          cliente_id: string
          funcionario_id: string
          servico_id: string
          data_hora: string
          status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
          motivo_cancelamento?: string | null
          data_conclusao?: string | null
          employee_id?: string | null
          salao_id: string
        }
        Update: {
          id?: string
          cliente_id?: string
          funcionario_id?: string
          servico_id?: string
          data_hora?: string
          status?: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
          motivo_cancelamento?: string | null
          data_conclusao?: string | null
          employee_id?: string | null
          salao_id?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string
          telefone: string | null
          cargo: string | null
          nome: string | null
          email: string | null
          salao_id: string
          criado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          telefone?: string | null
          cargo?: string | null
          nome?: string | null
          email?: string | null
          salao_id: string
          criado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          telefone?: string | null
          cargo?: string | null
          nome?: string | null
          email?: string | null
          salao_id?: string
          criado_em?: string
        }
      }
      saloes: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          email: string | null
          telefone: string | null
          endereco: string | null
          working_hours: any | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          working_hours?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          working_hours?: any | null
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          preco: number
          duracao_minutos: number
          categoria: string | null
          salao_id: string
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          preco: number
          duracao_minutos: number
          categoria?: string | null
          salao_id: string
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          preco?: number
          duracao_minutos?: number
          categoria?: string | null
          salao_id?: string
          criado_em?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          nome: string
          telefone: string | null
          tipo: 'admin' | 'funcionario' | 'cliente' | 'system_admin'
          senha: string | null
          data_nascimento: string | null
          endereco: string | null
          observacoes: string | null
          salao_id: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          telefone?: string | null
          tipo: 'admin' | 'funcionario' | 'cliente' | 'system_admin'
          senha?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          observacoes?: string | null
          salao_id?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          telefone?: string | null
          tipo?: 'admin' | 'funcionario' | 'cliente' | 'system_admin'
          senha?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          observacoes?: string | null
          salao_id?: string | null
          criado_em?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface Appointment {
  id: string;
  salao_id: string;
  cliente_id: string;
  funcionario_id: string;
  servico_id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  motivo_cancelamento?: string;
  data_conclusao?: string;
  criado_em: string;
  observacoes?: string;
}
