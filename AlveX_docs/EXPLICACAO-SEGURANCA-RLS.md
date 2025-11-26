# 🔒 Explicação - Segurança RLS

## ⚠️ Por que desabilitar RLS é perigoso?

Com RLS desabilitado (`DISABLE ROW LEVEL SECURITY`):

### Riscos:
1. **Qualquer um pode criar solicitações falsas**
   - Spam de agendamentos
   - Sobrecarregar o sistema
   - Agendamentos em horários inválidos

2. **Qualquer um pode ver TODAS as solicitações**
   - Dados pessoais de clientes (nome, telefone, email)
   - Informações de todos os salões
   - Violação de privacidade

3. **Qualquer um pode editar/deletar**
   - Cancelar agendamentos legítimos
   - Alterar dados de clientes
   - Destruir informações

## ✅ Solução: RLS com políticas corretas

### O que as políticas corretas fazem:

#### Política 1: Público pode CRIAR
```sql
FOR INSERT TO public
```
- ✅ Permite que página pública crie solicitações
- ✅ Valida que `salao_id` existe
- ❌ NÃO permite editar ou deletar

#### Política 2: Autenticados podem VER
```sql
FOR SELECT TO authenticated
```
- ✅ Funcionários veem solicitações do seu salão
- ✅ Admins veem solicitações do seu salão
- ❌ Público NÃO vê nada
- ❌ Outros salões NÃO veem

#### Política 3: Admins podem GERENCIAR
```sql
FOR ALL TO authenticated (com validação de admin)
```
- ✅ Admins podem aprovar/rejeitar
- ✅ Admins podem editar/deletar
- ❌ Funcionários NÃO podem deletar
- ❌ Outros salões NÃO podem gerenciar

## 🎯 Comparação

| Ação | RLS Desabilitado | RLS Habilitado (Correto) |
|------|------------------|--------------------------|
| Público criar solicitação | ✅ Permite | ✅ Permite |
| Público ver solicitações | ⚠️ **VÊ TUDO** | ❌ Bloqueado |
| Público editar/deletar | ⚠️ **PODE TUDO** | ❌ Bloqueado |
| Funcionário ver do seu salão | ✅ Permite | ✅ Permite |
| Funcionário ver de outro salão | ⚠️ **VÊ TUDO** | ❌ Bloqueado |
| Admin gerenciar | ✅ Permite | ✅ Permite |

## 🔐 Resumo da Segurança

### Com RLS correto:
- ✅ Página pública funciona (pode criar solicitações)
- ✅ Dados protegidos (público não vê nada)
- ✅ Multi-tenancy (cada salão vê só o seu)
- ✅ Controle de acesso (admins > funcionários > público)

### Sem RLS (perigoso):
- ⚠️ Sistema aberto para qualquer um
- ⚠️ Violação de privacidade
- ⚠️ Vulnerável a ataques
- ⚠️ Dados de todos os salões expostos

## 📝 Conclusão

**NUNCA deixe RLS desabilitado em produção!**

Use apenas para:
- ✅ Debug temporário (5-10 minutos)
- ✅ Identificar problemas
- ❌ **NUNCA em produção final**

Sempre reabilite RLS com políticas corretas imediatamente após o debug.


