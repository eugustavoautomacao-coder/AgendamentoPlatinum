# Sistema de Tratamento de Erros

## Visão Geral

O sistema de tratamento de erros foi implementado para fornecer mensagens claras e específicas em português brasileiro para todos os erros que ocorrem no sistema, sem emojis e com foco na experiência do usuário.

## Componentes

### 1. `src/utils/errorMessages.ts`

Utilitário principal que mapeia erros do Supabase e outros sistemas para mensagens em português:

- **`getErrorMessage(error)`**: Converte qualquer erro em uma mensagem clara em português
- **`getErrorTitle(error)`**: Retorna um título apropriado para o erro
- **`isCriticalError(error)`**: Determina se o erro requer ação imediata do usuário

### 2. `src/hooks/useErrorHandler.ts`

Hook personalizado que facilita o uso do sistema de tratamento de erros:

```typescript
const { handleError, handleSuccess, handleWarning, handleInfo } = useErrorHandler();

// Uso
handleError(error, 'Contexto da operação');
handleSuccess('Operação realizada com sucesso!');
```

### 3. Integração nos Hooks de Autenticação

#### `src/hooks/useAuth.tsx`
- Tratamento de erros de login e cadastro
- Mensagens específicas para credenciais inválidas, e-mail não confirmado, etc.

#### `src/hooks/useClienteAuth.tsx`
- Tratamento de erros específicos para clientes
- Validação de senhas e verificação de usuários

## Tipos de Erros Tratados

### Erros de Autenticação
- **Credenciais inválidas**: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente."
- **E-mail não confirmado**: "E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação."
- **Muitas tentativas**: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
- **Usuário não encontrado**: "Usuário não encontrado. Verifique se o e-mail está correto."

### Erros de Validação
- **Senha fraca**: "Senha muito fraca. Use pelo menos 6 caracteres com letras e números."
- **E-mail inválido**: "E-mail inválido. Verifique o formato do e-mail."
- **E-mail já cadastrado**: "Este e-mail já está cadastrado no sistema."

### Erros de Sistema
- **Erro de conexão**: "Erro de conexão. Verifique sua internet e tente novamente."
- **Timeout**: "Tempo limite excedido. Tente novamente em alguns instantes."
- **Erro interno**: "Erro interno do servidor. Tente novamente mais tarde."

### Erros de Banco de Dados
- **PGRST116**: "Registro não encontrado no banco de dados."
- **PGRST301**: "Acesso negado. Você não tem permissão para esta operação."
- **PGRST302**: "Sessão expirada. Faça login novamente."

## Como Usar

### 1. Em Componentes React

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleSuccess } = useErrorHandler();

  const handleOperation = async () => {
    try {
      // Operação que pode falhar
      await someOperation();
      handleSuccess('Operação realizada com sucesso!');
    } catch (error) {
      handleError(error, 'Realizar operação');
    }
  };
};
```

### 2. Em Hooks Personalizados

```typescript
import { getErrorMessage, getErrorTitle } from '@/utils/errorMessages';

const useMyHook = () => {
  const handleError = (error: any) => {
    const message = getErrorMessage(error);
    const title = getErrorTitle(error);
    // Usar message e title conforme necessário
  };
};
```

### 3. Em Páginas

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyPage = () => {
  const { handleError, handleSuccess } = useErrorHandler();

  // Usar nos handlers de eventos
  const handleSubmit = async () => {
    try {
      // Lógica
      handleSuccess('Dados salvos com sucesso!');
    } catch (error) {
      handleError(error, 'Salvar dados');
    }
  };
};
```

## Características

### 1. Mensagens em Português
- Todas as mensagens são em português brasileiro
- Linguagem clara e acessível
- Instruções específicas para o usuário

### 2. Sem Emojis
- Foco na clareza da mensagem
- Interface mais profissional
- Melhor acessibilidade

### 3. Contexto Específico
- Mensagens adaptadas ao contexto da operação
- Diferenciação entre erros críticos e informativos
- Sugestões de ação quando apropriado

### 4. Categorização de Erros
- **Erros críticos**: Requerem ação imediata do usuário
- **Erros informativos**: Podem ser ignorados ou tratados posteriormente
- **Erros de validação**: Campos específicos com problemas

### 5. Estilização Consistente
- Toasts com cores apropriadas para cada tipo de erro
- Bordas coloridas para identificação visual
- Gradientes para melhor apresentação

## Benefícios

1. **Melhor UX**: Usuários entendem exatamente o que aconteceu
2. **Menos Suporte**: Mensagens claras reduzem dúvidas dos usuários
3. **Debugging**: Desenvolvedores podem identificar problemas mais facilmente
4. **Consistência**: Todas as mensagens seguem o mesmo padrão
5. **Acessibilidade**: Mensagens sem emojis são mais acessíveis

## Exemplos de Uso

### Login com Credenciais Inválidas
```
Título: "Erro de Login"
Mensagem: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente."
```

### Erro de Conexão
```
Título: "Erro de Conexão"
Mensagem: "Erro de conexão. Verifique sua internet e tente novamente."
```

### Validação de Formulário
```
Título: "Dados Inválidos"
Mensagem: "E-mail inválido. Verifique o formato do e-mail."
```

### Sucesso
```
Título: "Sucesso"
Mensagem: "Usuário criado com sucesso!"
```

## Manutenção

Para adicionar novos tipos de erro:

1. Adicione o mapeamento em `src/utils/errorMessages.ts`
2. Teste com diferentes cenários de erro
3. Atualize a documentação se necessário
4. Verifique se as mensagens são claras e úteis

O sistema é extensível e pode ser facilmente atualizado conforme novas necessidades surgem.
