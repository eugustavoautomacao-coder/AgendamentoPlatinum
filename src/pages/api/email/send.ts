import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 Recebendo solicitação de envio de email...');
    const { to, subject, html, text } = req.body;

    // Validação básica
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: to, subject, html' 
      });
    }

    // Configuração SMTP do Brevo
    const transporter = nodemailer.createTransporter({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

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

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso:', info.messageId);
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email enviado com sucesso!' 
    });
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao enviar email'
    });
  }
}
