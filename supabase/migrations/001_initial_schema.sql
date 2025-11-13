-- Schema inicial do banco de dados
-- Projeto: buiqjpncuddpoamdcoco

-- Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: saloes
CREATE TABLE IF NOT EXISTS public.saloes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  cnpj character varying,
  email character varying,
  created_at timestamp with time zone DEFAULT now(),
  telefone text,
  endereco text,
  working_hours jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT saloes_pkey PRIMARY KEY (id)
);

-- Tabela: users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone text,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['admin'::text, 'funcionario'::text, 'cliente'::text, 'system_admin'::text])),
  criado_em timestamp with time zone DEFAULT now(),
  senha text,
  data_nascimento date,
  endereco text,
  observacoes text,
  salao_id uuid,
  avatar_url text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id)
);

-- Tabela: employees
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  criado_em timestamp with time zone DEFAULT now(),
  telefone character varying,
  cargo character varying,
  nome character varying,
  email character varying UNIQUE,
  salao_id uuid,
  avatar_url text,
  percentual_comissao numeric DEFAULT 0.00 CHECK (percentual_comissao >= 0::numeric AND percentual_comissao <= 100::numeric),
  ativo boolean DEFAULT true,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Tabela: services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  descricao text,
  preco numeric NOT NULL,
  duracao_minutos integer NOT NULL,
  criado_em timestamp with time zone DEFAULT now(),
  categoria text,
  salao_id uuid,
  observacao text,
  taxa_custo_tipo character varying DEFAULT 'fixo'::character varying CHECK (taxa_custo_tipo::text = ANY (ARRAY['fixo'::character varying, 'percentual'::character varying]::text[])),
  taxa_custo_valor numeric DEFAULT 0.00 CHECK (taxa_custo_valor >= 0::numeric),
  ativo boolean DEFAULT true,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id)
);

-- Tabela: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid,
  funcionario_id uuid,
  servico_id uuid,
  data_hora timestamp with time zone NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pendente'::text, 'confirmado'::text, 'cancelado'::text, 'concluido'::text])),
  motivo_cancelamento text,
  data_conclusao timestamp without time zone,
  employee_id uuid,
  salao_id uuid,
  observacoes text,
  cliente_nome character varying,
  cliente_telefone character varying,
  cliente_email character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.users(id),
  CONSTRAINT appointments_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.employees(id),
  CONSTRAINT appointments_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT appointments_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.services(id),
  CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabela: appointment_photos
CREATE TABLE IF NOT EXISTS public.appointment_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  photo_url text NOT NULL,
  phase text NOT NULL CHECK (phase = ANY (ARRAY['antes'::text, 'durante'::text, 'depois'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointment_photos_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_photos_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);

-- Tabela: appointment_requests
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  servico_id uuid NOT NULL,
  funcionario_id uuid,
  data_hora timestamp with time zone NOT NULL,
  cliente_nome character varying NOT NULL,
  cliente_telefone character varying NOT NULL,
  cliente_email character varying,
  observacoes text,
  status character varying DEFAULT 'pendente'::character varying CHECK (status::text = ANY (ARRAY['pendente'::character varying, 'aprovado'::character varying, 'rejeitado'::character varying, 'cancelado'::character varying]::text[])),
  motivo_rejeicao text,
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  appointment_id uuid,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT appointment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_requests_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT appointment_requests_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.services(id),
  CONSTRAINT appointment_requests_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.employees(id),
  CONSTRAINT appointment_requests_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES public.users(id),
  CONSTRAINT appointment_requests_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);

-- Tabela: blocked_slots
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  funcionario_id uuid NOT NULL,
  data date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fim time without time zone NOT NULL,
  motivo text,
  criado_por uuid,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT blocked_slots_pkey PRIMARY KEY (id),
  CONSTRAINT blocked_slots_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT blocked_slots_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.employees(id),
  CONSTRAINT blocked_slots_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id)
);

-- Tabela: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  nome character varying NOT NULL,
  ativo boolean DEFAULT true,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT categorias_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id)
);

-- Tabela: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  nome character varying NOT NULL,
  email character varying NOT NULL,
  telefone character varying NOT NULL DEFAULT 'Não informado'::character varying,
  senha_hash character varying NOT NULL DEFAULT 'senha123'::character varying,
  senha_temporaria boolean DEFAULT true,
  ativo boolean DEFAULT true,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  ultimo_login timestamp with time zone,
  CONSTRAINT clientes_pkey PRIMARY KEY (id),
  CONSTRAINT clientes_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id)
);

-- Tabela: comissoes
CREATE TABLE IF NOT EXISTS public.comissoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  funcionario_id uuid NOT NULL,
  servico_id uuid NOT NULL,
  valor_servico numeric NOT NULL,
  taxa_custo_tipo character varying NOT NULL,
  taxa_custo_valor numeric NOT NULL,
  valor_taxa_custo numeric NOT NULL,
  base_calculo_comissao numeric NOT NULL,
  percentual_comissao numeric NOT NULL,
  valor_comissao numeric NOT NULL,
  status character varying DEFAULT 'pendente'::character varying CHECK (status::text = ANY (ARRAY['pendente'::character varying, 'paga'::character varying, 'cancelada'::character varying]::text[])),
  data_calculo timestamp with time zone DEFAULT now(),
  data_pagamento timestamp with time zone,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT comissoes_pkey PRIMARY KEY (id),
  CONSTRAINT comissoes_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT comissoes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT comissoes_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.employees(id),
  CONSTRAINT comissoes_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.services(id)
);

-- Tabela: comissoes_mensais
CREATE TABLE IF NOT EXISTS public.comissoes_mensais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  funcionario_id uuid NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL CHECK (ano >= 2020),
  total_agendamentos integer DEFAULT 0,
  total_servicos numeric DEFAULT 0.00,
  total_taxas numeric DEFAULT 0.00,
  base_calculo_total numeric DEFAULT 0.00,
  percentual_comissao numeric NOT NULL,
  valor_comissao_total numeric DEFAULT 0.00,
  valor_pago numeric DEFAULT 0.00,
  saldo_pendente numeric DEFAULT 0.00,
  status character varying DEFAULT 'aberto'::character varying CHECK (status::text = ANY (ARRAY['aberto'::character varying, 'fechado'::character varying, 'pago'::character varying]::text[])),
  data_fechamento timestamp with time zone,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT comissoes_mensais_pkey PRIMARY KEY (id),
  CONSTRAINT comissoes_mensais_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT comissoes_mensais_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.employees(id)
);

-- Tabela: comissoes_agendamentos_detalhes
CREATE TABLE IF NOT EXISTS public.comissoes_agendamentos_detalhes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comissao_mensal_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  valor_servico numeric NOT NULL,
  taxa_custo numeric NOT NULL,
  base_calculo numeric NOT NULL,
  valor_comissao numeric NOT NULL,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT comissoes_agendamentos_detalhes_pkey PRIMARY KEY (id),
  CONSTRAINT comissoes_agendamentos_detalhes_comissao_mensal_id_fkey FOREIGN KEY (comissao_mensal_id) REFERENCES public.comissoes_mensais(id),
  CONSTRAINT comissoes_agendamentos_detalhes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);

-- Tabela: comissoes_historico
CREATE TABLE IF NOT EXISTS public.comissoes_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comissao_id uuid NOT NULL,
  acao character varying NOT NULL CHECK (acao::text = ANY (ARRAY['criada'::character varying, 'alterada'::character varying, 'paga'::character varying, 'cancelada'::character varying]::text[])),
  valor_anterior numeric,
  valor_novo numeric,
  motivo text,
  usuario_id uuid,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT comissoes_historico_pkey PRIMARY KEY (id),
  CONSTRAINT comissoes_historico_comissao_id_fkey FOREIGN KEY (comissao_id) REFERENCES public.comissoes(id),
  CONSTRAINT comissoes_historico_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id)
);

-- Tabela: pagamentos_comissoes
CREATE TABLE IF NOT EXISTS public.pagamentos_comissoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comissao_mensal_id uuid NOT NULL,
  valor_pago numeric NOT NULL,
  data_pagamento timestamp with time zone DEFAULT now(),
  forma_pagamento character varying DEFAULT 'não informado'::character varying,
  observacoes text,
  usuario_id uuid,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT pagamentos_comissoes_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_comissoes_comissao_mensal_id_fkey FOREIGN KEY (comissao_mensal_id) REFERENCES public.comissoes_mensais(id),
  CONSTRAINT pagamentos_comissoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id)
);

-- Tabela: produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salao_id uuid NOT NULL,
  nome character varying NOT NULL,
  descricao text,
  categoria character varying,
  marca character varying,
  preco_custo numeric NOT NULL DEFAULT 0.00,
  preco_venda numeric NOT NULL DEFAULT 0.00,
  estoque_atual integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  unidade_medida character varying NOT NULL DEFAULT 'unidade'::character varying,
  codigo_barras character varying,
  fornecedor character varying,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  codigo_interno character varying NOT NULL DEFAULT ''::character varying,
  preco_profissional numeric DEFAULT 0.00,
  para_revenda boolean DEFAULT true,
  categoria_id uuid,
  CONSTRAINT produtos_pkey PRIMARY KEY (id),
  CONSTRAINT produtos_salao_id_fkey FOREIGN KEY (salao_id) REFERENCES public.saloes(id),
  CONSTRAINT produtos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_appointments_salao_id ON public.appointments(salao_id);
CREATE INDEX IF NOT EXISTS idx_appointments_funcionario_id ON public.appointments(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_hora ON public.appointments(data_hora);
CREATE INDEX IF NOT EXISTS idx_employees_salao_id ON public.employees(salao_id);
CREATE INDEX IF NOT EXISTS idx_services_salao_id ON public.services(salao_id);
CREATE INDEX IF NOT EXISTS idx_users_salao_id ON public.users(salao_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_funcionario_data ON public.blocked_slots(funcionario_id, data);

