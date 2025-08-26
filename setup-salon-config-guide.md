# Guia para Configurar Dados do Salão

## 📋 Passos para Configurar

### 1. Executar Script SQL
Execute o arquivo `add-salon-fields.sql` no Supabase SQL Editor para adicionar os campos necessários:

```sql
-- Adicionar campos básicos do salão
ALTER TABLE public.saloes 
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}';
```

### 2. Verificar Campos Adicionados
Após executar o script, verifique se os campos foram criados corretamente:

```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'saloes'
ORDER BY ordinal_position;
```

### 3. Inserir Dados de Exemplo (Opcional)
Para testar, você pode inserir dados de exemplo:

```sql
UPDATE public.saloes 
SET 
    telefone = '(11) 99999-9999',
    endereco = 'Rua das Flores, 123 - Centro',
    working_hours = '{
        "monday": {"open": "08:00", "close": "18:00", "active": true},
        "tuesday": {"open": "08:00", "close": "18:00", "active": true},
        "wednesday": {"open": "08:00", "close": "18:00", "active": true},
        "thursday": {"open": "08:00", "close": "18:00", "active": true},
        "friday": {"open": "08:00", "close": "19:00", "active": true},
        "saturday": {"open": "08:00", "close": "17:00", "active": true},
        "sunday": {"open": "09:00", "close": "15:00", "active": false}
    }'
WHERE id = 'seu-salao-id-aqui';
```

## ✅ Campos Adicionados

### Tabela `saloes`
- **`telefone`**: Telefone do salão
- **`endereco`**: Endereço completo do salão  
- **`working_hours`**: Horários de funcionamento em formato JSON

### Estrutura do `working_hours`
```json
{
  "monday": {"open": "08:00", "close": "18:00", "active": true},
  "tuesday": {"open": "08:00", "close": "18:00", "active": true},
  "wednesday": {"open": "08:00", "close": "18:00", "active": true},
  "thursday": {"open": "08:00", "close": "18:00", "active": true},
  "friday": {"open": "08:00", "close": "19:00", "active": true},
  "saturday": {"open": "08:00", "close": "17:00", "active": true},
  "sunday": {"open": "09:00", "close": "15:00", "active": false}
}
```

## 🔧 Funcionalidades Atualizadas

### 1. Hook `useSalonInfo`
- Agora busca todos os campos do salão
- Inclui `telefone`, `endereco` e `working_hours`
- Cache local para melhor performance

### 2. Página de Configurações
- Formulário para editar dados do salão
- Configuração de horários de funcionamento
- Salvamento automático no banco de dados

### 3. Tipos TypeScript
- Interface `SalonInfo` atualizada
- Tipos para `working_hours`
- Compatibilidade com componentes existentes

## 🎯 Próximos Passos

1. **Execute o script completo** (`setup-salon-complete.sql`) no Supabase SQL Editor
   - Este script adiciona todos os campos necessários
   - Insere horários de exemplo
   - Testa as consultas

2. **Substitua o ID do salão** no script:
   - Encontre o ID do seu salão executando: `SELECT id, nome FROM saloes;`
   - Substitua `'seu-salao-id-aqui'` pelo ID real

3. **Execute o script de RLS** se necessário (`fix-salon-rls.sql` ou `disable-salon-rls-dev.sql`)

4. **Teste a página de configurações** em `/admin/configuracoes`

5. **Teste a agenda** em `/admin/agenda` para ver os horários funcionando

6. **Verifique os logs** no console do navegador para debug

## 🔧 Solução de Problemas

### Problema: Dados não são salvos
Se os dados não estão sendo salvos no banco:

1. **Verifique o console do navegador** para erros
2. **Execute o script RLS** para corrigir permissões
3. **Teste com RLS desabilitado** usando `disable-salon-rls-dev.sql`

### Problema: Frontend não atualiza
Se o frontend não mostra as mudanças:

1. **Limpe o cache local** (já implementado automaticamente)
2. **Recarregue a página** após salvar
3. **Verifique se o `refetchSalonInfo`** está sendo chamado

### Problema: "column working_hours does not exist"
Se você receber este erro:

1. **Execute primeiro** o script `setup-salon-complete.sql`
2. **Verifique se os campos foram criados** com `verify-salon-fields.sql`
3. **Só depois execute** os scripts de teste
4. **Substitua o ID do salão** pelo ID real do seu salão

## 📝 Notas Importantes

- Os campos são opcionais (NULL permitido)
- O `working_hours` tem valor padrão `{}`
- A agenda usa os horários configurados para gerar slots
- Cache local expira em 24 horas

## 🗓️ Integração com a Agenda

### Funcionalidades Implementadas

1. **Horários Dinâmicos**: A agenda agora usa os horários configurados em `/admin/configuracoes`
2. **Dias Fechados**: Quando um dia está marcado como inativo, a agenda mostra uma mensagem de "Salão Fechado"
3. **Horários Personalizados**: Cada dia pode ter horários diferentes (abertura/fechamento)
4. **Indicador Visual**: O header da agenda mostra o horário de funcionamento do dia selecionado

### Como Funciona

1. **Configuração**: Configure os horários em `/admin/configuracoes`
2. **Agenda**: Navegue para `/admin/agenda` e veja os horários refletidos
3. **Navegação**: Use as setas para navegar entre os dias e veja horários diferentes
4. **Feedback**: A agenda mostra claramente quando o salão está fechado

### Exemplo de Uso

- **Segunda a Sexta**: 08:00 - 18:00 (ativo)
- **Sábado**: 08:00 - 17:00 (ativo)  
- **Domingo**: 09:00 - 15:00 (inativo)

Quando você navegar para domingo na agenda, verá a mensagem "Salão Fechado" e nenhum slot de horário será exibido.
