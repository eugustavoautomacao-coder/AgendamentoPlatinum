import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    // Validação básica
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configuração SMTP do Brevo
    const transporter = {
      host: Deno.env.get('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com',
      port: parseInt(Deno.env.get('BREVO_SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: Deno.env.get('BREVO_SMTP_USER'),
        pass: Deno.env.get('BREVO_SMTP_PASS')
      }
    }

    // Configurar email
    const mailOptions = {
      from: {
        name: Deno.env.get('BREVO_FROM_NAME') || 'AlveX Sistema',
        address: Deno.env.get('BREVO_FROM_EMAIL') || '95bbc9001@smtp-brevo.com'
      },
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    }

    // Enviar email usando fetch para Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': Deno.env.get('BREVO_API_KEY') || '',
      },
      body: JSON.stringify({
        sender: {
          email: mailOptions.from.address,
          name: mailOptions.from.name
        },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html,
        textContent: mailOptions.text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Brevo API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email enviado com sucesso!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido ao enviar email'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
