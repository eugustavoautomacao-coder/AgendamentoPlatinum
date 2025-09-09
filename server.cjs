const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração SMTP do Brevo
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
  secure: false, // Sempre false para porta 587
  auth: {
    user: process.env.BREVO_SMTP_USER, // Seu email de login da Brevo
    pass: process.env.BREVO_SMTP_PASS  // Sua chave SMTP (não a API key)
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,   // 30 segundos
  socketTimeout: 60000      // 60 segundos
});

// Configuração alternativa para porta 465 (SSL)
const transporterSSL = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: 465,
  secure: true, // SSL para porta 465
  auth: {
    user: process.env.BREVO_SMTP_USER, // Seu email de login da Brevo
    pass: process.env.BREVO_SMTP_PASS  // Sua chave SMTP (não a API key)
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Rota de teste de conexão SMTP
app.post('/api/email/test', async (req, res) => {
  try {
    console.log('🔍 Testando conexão SMTP...');
    console.log('📧 Host:', process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com');
    console.log('🔌 Porta:', process.env.BREVO_SMTP_PORT || '587');
    console.log('🔒 Secure:', process.env.BREVO_SMTP_SECURE === 'true' ? 'true (SSL)' : 'false (TLS)');
    console.log('👤 Usuário SMTP:', process.env.BREVO_SMTP_USER || 'NÃO CONFIGURADO');
    console.log('🔑 Chave SMTP:', process.env.BREVO_SMTP_PASS ? '***' + process.env.BREVO_SMTP_PASS.slice(-4) : 'NÃO CONFIGURADA');
    
    // Tentar porta 587 primeiro
    try {
      console.log('🔄 Tentando porta 587 (TLS)...');
      await transporter.verify();
      console.log('✅ Conexão SMTP estabelecida com sucesso na porta 587!');
      
      res.json({ 
        success: true, 
        message: 'Conexão SMTP estabelecida com sucesso na porta 587!' 
      });
      return;
    } catch (error587) {
      console.log('❌ Falha na porta 587, tentando porta 465...');
      
      // Tentar porta 465 (SSL)
      try {
        await transporterSSL.verify();
        console.log('✅ Conexão SMTP estabelecida com sucesso na porta 465!');
        
        res.json({ 
          success: true, 
          message: 'Conexão SMTP estabelecida com sucesso na porta 465!' 
        });
        return;
      } catch (error465) {
        console.error('❌ Ambas as portas falharam');
        throw error587; // Usar o primeiro erro para detalhes
      }
    }
  } catch (error) {
    console.error('❌ Erro na conexão SMTP:', error);
    console.error('🔍 Detalhes do erro:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido na conexão SMTP',
      details: {
        code: error.code,
        hostname: error.hostname
      }
    });
  }
});

// Rota para enviar emails
app.post('/api/email/send', async (req, res) => {
  try {
    console.log('📧 Recebendo solicitação de envio de email...');
    const { to, subject, html, text } = req.body;

    console.log('📋 Dados recebidos:', {
      to,
      subject,
      subjectLength: subject?.length,
      htmlLength: html?.length,
      hasText: !!text
    });

    // Validação básica
    if (!to || !subject || !html) {
      console.log('❌ Validação falhou:', { to: !!to, subject: !!subject, html: !!html });
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: to, subject, html' 
      });
    }

    // Configurar email
    const mailOptions = {
      from: {
        name: process.env.BREVO_FROM_NAME || 'AlveX Sistema',
        address: process.env.BREVO_FROM_EMAIL || '95bbc9001@smtp-brevo.com'
      },
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    };

    console.log('📨 Configuração do email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html.length,
      textLength: mailOptions.text.length
    });

    // Escolher o transporter correto baseado na configuração
    const transporterToUse = transporter; // Sempre usar TLS para porta 587
    console.log('🔌 Usando transporter: TLS (587)');
    
    // Enviar email
    console.log('🚀 Iniciando envio do email...');
    const info = await transporterToUse.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso:', {
      messageId: info.messageId,
      response: info.response
    });
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email enviado com sucesso!' 
    });
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    console.error('🔍 Detalhes do erro:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      command: error.command,
      response: error.response
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao enviar email',
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});

// Rota principal
app.get('/api/email', (req, res) => {
  res.json({ 
    message: 'API de Email - AlveX',
    endpoints: {
      test: '/api/email/test',
      send: '/api/email/send'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Email rodando na porta ${PORT}`);
  console.log(`📧 Endpoints disponíveis:`);
  console.log(`   - Teste SMTP: http://localhost:${PORT}/api/email/test`);
  console.log(`   - Enviar Email: http://localhost:${PORT}/api/email/send`);
});
