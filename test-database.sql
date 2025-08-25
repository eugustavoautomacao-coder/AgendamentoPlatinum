-- Script para testar o banco de dados e verificar se há dados

-- 1. Verificar se o usuário logado existe
SELECT 
    id,
    nome,
    email,
    tipo,
    salao_id,
    criado_em
FROM users 
WHERE tipo = 'admin'
LIMIT 5;

-- 2. Verificar se há salões
SELECT 
    id,
    nome,
    email,
    cnpj,
    created_at
FROM saloes
LIMIT 5;

-- 3. Verificar se há funcionários (employees)
SELECT 
    id,
    nome,
    email,
    telefone,
    cargo,
    salao_id,
    criado_em
FROM employees
LIMIT 5;

-- 4. Verificar se há clientes
SELECT 
    id,
    nome,
    email,
    telefone,
    tipo,
    salao_id,
    criado_em
FROM users 
WHERE tipo = 'cliente'
LIMIT 5;

-- 5. Verificar se há serviços
SELECT 
    id,
    nome,
    descricao,
    duracao_minutos,
    preco,
    categoria,
    salao_id,
    criado_em
FROM services
LIMIT 5;

-- 6. Verificar se há agendamentos
SELECT 
    id,
    cliente_id,
    funcionario_id,
    servico_id,
    data_hora,
    status,
    salao_id,
    criado_em
FROM appointments
LIMIT 5;

-- 7. Verificar relacionamentos - funcionários por salão
SELECT 
    s.nome as salao_nome,
    COUNT(e.id) as total_funcionarios
FROM saloes s
LEFT JOIN employees e ON s.id = e.salao_id
GROUP BY s.id, s.nome
ORDER BY s.nome;

-- 8. Verificar relacionamentos - clientes por salão
SELECT 
    s.nome as salao_nome,
    COUNT(u.id) as total_clientes
FROM saloes s
LEFT JOIN users u ON s.id = u.salao_id AND u.tipo = 'cliente'
GROUP BY s.id, s.nome
ORDER BY s.nome;

-- 9. Verificar relacionamentos - serviços por salão
SELECT 
    s.nome as salao_nome,
    COUNT(serv.id) as total_servicos
FROM saloes s
LEFT JOIN services serv ON s.id = serv.salao_id
GROUP BY s.id, s.nome
ORDER BY s.nome;
