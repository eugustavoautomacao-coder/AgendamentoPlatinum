# Funcionalidades que Não Estão Funcionando

## 🔴 Prioridade ALTA

### 1. Relatórios do Profissional
**Status:** ❌ Não implementado
**Localização:** `src/pages/profissional/Relatorios.tsx`
**Problema:** Página existe mas mostra apenas "Nenhum relatório disponível"
**Impacto:** Profissionais não têm acesso a relatórios

### 2. Função RPC `fechar_mes_comissoes`
**Status:** ❌ **NÃO EXISTE NO BANCO**
**Localização:** `src/pages/admin/ComissoesMensais.tsx:322`
**Uso:** Usada para fechar o mês de comissões
**Problema:** Função **NÃO existe** no banco de dados - nenhuma migration encontrada
**Impacto:** Botão "Fechar Mês" não funciona, gera erro ao tentar usar
**Solução:** Criar função SQL no banco ou implementar lógica no frontend

### 3. Sistema de Lembretes Automáticos
**Status:** ⚠️ Parcialmente funcional
**Localização:** 
- `src/hooks/useLembretesAutomaticos.ts`
- `src/hooks/useLembretes.ts`
- `src/components/EmailNotificationManager.tsx`
**Problemas:**
- Usa `localStorage` para rastrear lembretes enviados (não persiste entre sessões/dispositivos)
- Não há tabela no banco para rastrear lembretes enviados
- Sistema pode enviar lembretes duplicados após refresh
- Não está integrado com sistema de notificações do banco

### 4. Configurações de Email
**Status:** ⚠️ Parcialmente funcional
**Localização:** `src/pages/admin/ConfiguracoesEmail.tsx`
**Problemas:**
- Configurações salvas apenas em `localStorage` (não persiste no banco)
- Não há integração com sistema de configurações do salão
- Testes de email podem não estar funcionando corretamente

## 🟡 Prioridade MÉDIA

### 5. Reset de Senha para Clientes
**Status:** ⚠️ Complexo, pode ter problemas
**Localização:** `src/pages/ResetPassword.tsx`
**Problemas:**
- Sistema de tokens via `localStorage` (não seguro para produção)
- Múltiplos fluxos (cliente vs admin/profissional) podem causar confusão
- Validação de tokens pode não estar funcionando corretamente
- Links de recuperação podem expirar incorretamente

### 6. API Endpoints Faltando
**Status:** ❌ Documentados mas não implementados
**Localização:** `AlveX_docs/ANALISE-CRM-ROTAS.md`
**Endpoints faltando:**
- `GET /salon/{salonId}/clients` - Lista completa de clientes
- `GET /salon/{salonId}/client/{clientId}` - Detalhes de um cliente
- `PUT /salon/{salonId}/client/{clientId}` - Atualizar cliente
- `DELETE /salon/{salonId}/client/{clientId}` - Deletar cliente
- `GET /salon/{salonId}/bookings/upcoming` - Agendamentos futuros (pode estar implementado)
- `PATCH /salon/{salonId}/booking/{appointmentId}/status` - Atualizar status (pode estar implementado)
- `PUT /salon/{salonId}/booking/{appointmentId}/reschedule` - Reagendar (pode estar implementado)

### 7. Relatórios Admin (Implementação Completa)
**Status:** ⚠️ Páginas existem mas podem não estar totalmente funcionais
**Localização:** `src/pages/admin/relatorios/`
**Relatórios:**
- ✅ Faturamento - Existe
- ✅ Comissões - Existe
- ✅ Clientes - Existe
- ✅ Serviços - Existe
- ✅ Agendamentos - Existe
- ✅ Funcionários - Existe
- ✅ Horários - Existe
**Verificar:** Se todos estão gerando dados corretos

### 8. Integração com Evolution API
**Status:** ⚠️ Parcialmente implementada
**Localização:** 
- `src/pages/api/evolution.ts`
- `supabase/functions/alvexapi/index.ts`
**Problemas:**
- Webhooks podem não estar configurados corretamente
- Notificações de status de agendamento podem não estar funcionando
- Lembretes via WhatsApp podem não estar implementados

## 🟢 Prioridade BAIXA

### 9. Sistema de Produtos
**Status:** ⚠️ Funcional mas pode ter limitações
**Localização:** 
- `src/pages/admin/Produtos.tsx`
- `src/pages/profissional/Produtos.tsx`
- `src/hooks/useProducts.tsx`
**Verificar:**
- Gestão de estoque está funcionando?
- Categorias estão sendo usadas corretamente?
- Relatório de produtos vendidos existe?

### 10. Notificações por Email
**Status:** ⚠️ Parcialmente funcional
**Localização:** 
- `src/services/emailService.ts`
- `src/hooks/useEmailNotifications.ts`
**Problemas:**
- Configuração SMTP pode não estar correta
- Templates de email podem não estar sendo usados
- Falhas no envio podem não estar sendo tratadas

### 11. Gestão de Categorias de Produtos
**Status:** ⚠️ Pode estar incompleto
**Localização:** `src/hooks/useCategories.tsx`
**Verificar:**
- CRUD completo de categorias
- Validação de categorias em uso
- Relacionamento com produtos

### 12. Sistema de Assinaturas (SuperAdmin)
**Status:** ❓ Não verificado
**Localização:** `src/pages/superadmin/Assinaturas.tsx`
**Verificar:** Se está implementado e funcional

### 13. Histórico de Comissões
**Status:** ⚠️ Pode ter problemas
**Localização:** `src/pages/admin/Comissoes.tsx`
**Problemas:**
- Busca de comissões individuais foi corrigida recentemente
- Verificar se histórico está sendo registrado corretamente
- Verificar se pagamentos estão sendo rastreados

### 14. Upload de Fotos de Processo
**Status:** ⚠️ Pode ter problemas de RLS
**Localização:** `src/pages/admin/Agenda.tsx`
**Problemas:**
- Políticas RLS para `process-photos` bucket podem não estar corretas
- Upload pode estar falhando silenciosamente

## 📋 Resumo por Prioridade

### 🔴 Alta Prioridade (4 itens)
1. Relatórios do Profissional
2. Função RPC `fechar_mes_comissoes`
3. Sistema de Lembretes Automáticos
4. Configurações de Email

### 🟡 Média Prioridade (4 itens)
5. Reset de Senha para Clientes
6. API Endpoints Faltando
7. Relatórios Admin (Verificação Completa)
8. Integração com Evolution API

### 🟢 Baixa Prioridade (6 itens)
9. Sistema de Produtos
10. Notificações por Email
11. Gestão de Categorias de Produtos
12. Sistema de Assinaturas
13. Histórico de Comissões
14. Upload de Fotos de Processo

## 🔍 Próximos Passos Recomendados

1. **Criar função RPC faltando:**
   - ❌ `fechar_mes_comissoes` - **NÃO EXISTE** - precisa ser criada
   - ✅ `recalcular_comissoes_mensais` - Existe em `supabase/migrations/20250115000000-create-commission-functions.sql`
   - ✅ `registrar_pagamento_comissao` - Existe em `supabase/migrations/20250115000000-create-commission-functions.sql`

2. **Implementar relatórios do profissional:**
   - Comissões pessoais
   - Agendamentos realizados
   - Serviços prestados

3. **Melhorar sistema de lembretes:**
   - Criar tabela para rastrear lembretes enviados
   - Mover lógica para backend (Edge Function ou cron job)
   - Implementar fila de envio

4. **Implementar API endpoints faltando:**
   - CRUD completo de clientes
   - Endpoints de agendamento
   - Endpoints de relatórios

5. **Melhorar configurações de email:**
   - Salvar configurações no banco
   - Integrar com configurações do salão
   - Melhorar testes de conexão

