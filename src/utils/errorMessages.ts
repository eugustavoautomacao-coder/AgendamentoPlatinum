// Mapeamento de erros do Supabase para mensagens em português brasileiro
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';

  // Erros de autenticação do Supabase
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // Erros de credenciais
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    
    if (message.includes('email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
    }
    
    if (message.includes('too many requests')) {
      return 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.';
    }
    
    if (message.includes('user not found')) {
      return 'Usuário não encontrado. Verifique se o e-mail está correto.';
    }
    
    if (message.includes('password')) {
      if (message.includes('weak')) {
        return 'Senha muito fraca. Use pelo menos 6 caracteres com letras e números.';
      }
      if (message.includes('incorrect') || message.includes('wrong')) {
        return 'Senha incorreta. Verifique sua senha e tente novamente.';
      }
    }
    
    if (message.includes('email')) {
      if (message.includes('invalid') || message.includes('malformed')) {
        return 'E-mail inválido. Verifique o formato do e-mail.';
      }
      if (message.includes('already registered') || message.includes('already exists')) {
        return 'Este e-mail já está cadastrado no sistema.';
      }
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (message.includes('timeout')) {
      return 'Tempo limite excedido. Tente novamente em alguns instantes.';
    }
    
    if (message.includes('session not found') || 
        message.includes('session id') ||
        message.includes('doesn\'t exist')) {
      return 'Sessão expirada. Faça login novamente.';
    }
    
    if (message.includes('server error') || message.includes('internal error')) {
      return 'Erro interno do servidor. Tente novamente em alguns instantes.';
    }
  }

  // Erros de código específicos do Supabase
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'Registro não encontrado no banco de dados.';
      case 'PGRST301':
        return 'Acesso negado. Você não tem permissão para esta operação.';
      case 'PGRST302':
        return 'Sessão expirada. Faça login novamente.';
      case 'PGRST400':
        return 'Dados inválidos fornecidos.';
      case 'PGRST401':
        return 'Não autorizado. Faça login para continuar.';
      case 'PGRST403':
        return 'Acesso proibido. Você não tem permissão para esta ação.';
      case 'PGRST404':
        return 'Recurso não encontrado.';
      case 'PGRST409':
        return 'Conflito de dados. O registro já existe.';
      case 'PGRST422':
        return 'Dados inválidos. Verifique os campos preenchidos.';
      case 'PGRST500':
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 'PGRST503':
        return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
    }
  }

  // Erros de validação de formulário
  if (error.field) {
    switch (error.field) {
      case 'email':
        return 'E-mail inválido. Verifique o formato do e-mail.';
      case 'password':
        return 'Senha inválida. Use pelo menos 6 caracteres.';
      case 'name':
        return 'Nome é obrigatório.';
      case 'phone':
        return 'Telefone inválido.';
      case 'cnpj':
        return 'CNPJ inválido.';
    }
  }

  // Erros de rede
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Erros de timeout
  if (error.name === 'TimeoutError') {
    return 'Tempo limite excedido. Tente novamente.';
  }

  // Erros de permissão
  if (error.message && error.message.includes('permission')) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  // Erros de validação
  if (error.message && error.message.includes('validation')) {
    return 'Dados inválidos. Verifique os campos preenchidos.';
  }

  // Erros de banco de dados
  if (error.message && error.message.includes('database')) {
    return 'Erro no banco de dados. Tente novamente em alguns instantes.';
  }

  // Erros de API
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Dados inválidos fornecidos.';
      case 401:
        return 'Não autorizado. Faça login para continuar.';
      case 403:
        return 'Acesso proibido. Você não tem permissão para esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito de dados. O registro já existe.';
      case 422:
        return 'Dados inválidos. Verifique os campos preenchidos.';
      case 429:
        return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 502:
        return 'Servidor temporariamente indisponível. Tente novamente em alguns instantes.';
      case 503:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
    }
  }

  // Mensagem padrão se não conseguir identificar o erro
  return 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.';
};

// Função para obter título do erro baseado no tipo
export const getErrorTitle = (error: any): string => {
  if (!error) return 'Erro';

  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('credentials') || message.includes('password') || message.includes('email')) {
      return 'Erro de Login';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'Acesso Negado';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Erro de Conexão';
    }
    
    if (message.includes('validation')) {
      return 'Dados Inválidos';
    }
  }

  if (error.code && error.code.startsWith('PGRST')) {
    return 'Erro do Sistema';
  }

  if (error.status) {
    if (error.status >= 400 && error.status < 500) {
      return 'Erro de Cliente';
    }
    if (error.status >= 500) {
      return 'Erro do Servidor';
    }
  }

  return 'Erro';
};

// Função para determinar se o erro é crítico (requer ação do usuário)
export const isCriticalError = (error: any): boolean => {
  if (!error) return false;

  if (error.message) {
    const message = error.message.toLowerCase();
    
    // Erros que requerem ação do usuário
    if (message.includes('email not confirmed')) return true;
    if (message.includes('password') && message.includes('weak')) return true;
    if (message.includes('email') && message.includes('invalid')) return true;
  }

  if (error.code) {
    // Códigos que requerem ação do usuário
    if (['PGRST401', 'PGRST403'].includes(error.code)) return true;
  }

  if (error.status) {
    // Status que requerem ação do usuário
    if ([401, 403, 422].includes(error.status)) return true;
  }

  return false;
};
