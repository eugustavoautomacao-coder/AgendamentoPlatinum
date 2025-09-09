import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testando conexão SMTP...');
    
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

    await transporter.verify();
    console.log('✅ Conexão SMTP estabelecida com sucesso!');
    
    res.json({ 
      success: true, 
      message: 'Conexão SMTP estabelecida com sucesso!' 
    });
  } catch (error: any) {
    console.error('❌ Erro na conexão SMTP:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido na conexão SMTP'
    });
  }
}
