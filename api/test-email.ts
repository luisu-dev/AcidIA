import type { VercelRequest, VercelResponse } from '@vercel/node';

// Endpoint temporal para probar emails
// IMPORTANTE: Eliminar después de probar
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  console.log('🧪 Enviando email de prueba a:', email);

  try {
    // Simular datos de una sesión de Stripe
    const mockSession = {
      id: 'cs_test_' + Date.now(),
      customer_details: {
        name: 'Cliente de Prueba',
        email: email,
      },
      amount_total: 150000, // $1,500 MXN en centavos
      payment_intent: 'pi_test_' + Date.now(),
    };

    const customerName = mockSession.customer_details.name;
    const customerEmail = mockSession.customer_details.email;
    const amount = mockSession.amount_total / 100;

    // 1. Enviar recibo al cliente
    const customerEmailResponse = await fetch('https://acidia.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerEmail,
        subject: '✅ ¡Bienvenido a AcidIA! - Pago confirmado',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #a200ff 0%, #04d9b5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #04d9b5; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">¡Bienvenido a AcidIA!</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${customerName}</strong>,</p>
                <p>¡Gracias por confiar en nosotros! Tu pago ha sido procesado exitosamente.</p>

                <div class="highlight">
                  <h3 style="margin-top: 0; color: #a200ff;">📋 Detalles de tu compra</h3>
                  <p><strong>Monto:</strong> $${amount.toFixed(2)} MXN</p>
                  <p><strong>Estado:</strong> ✅ Confirmado</p>
                  <p><strong>ID de transacción:</strong> ${mockSession.id}</p>
                </div>

                <h3 style="color: #04d9b5;">🚀 Próximos pasos</h3>
                <p>Nuestro equipo se pondrá en contacto contigo en las próximas <strong>24 horas</strong> para:</p>
                <ul>
                  <li>Iniciar el proceso de onboarding</li>
                  <li>Configurar tu cuenta y servicios</li>
                  <li>Resolver cualquier duda que tengas</li>
                </ul>

                <p>Si tienes alguna pregunta, responde a este correo o escríbenos.</p>

                <p>¡Estamos emocionados de trabajar contigo!</p>
                <p><strong>El equipo de AcidIA</strong></p>
              </div>
              <div class="footer">
                <p>Este es un correo automático. Por favor no respondas a esta dirección.</p>
                <p>AcidIA © 2025 - Automatización con IA</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    // 2. Notificar al admin
    const adminEmailResponse = await fetch('https://acidia.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ADMIN_EMAIL || 'luisu.dev@gmail.com',
        subject: '🎉 Nuevo cliente en AcidIA - Acción requerida',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert { background: #04d9b5; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .data-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
              .action { background: #a200ff; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="alert">
                <h2 style="margin: 0;">🎉 Nuevo pago recibido</h2>
              </div>

              <p><strong>Se ha completado un nuevo pago en AcidIA.</strong></p>

              <div class="data-box">
                <h3 style="margin-top: 0;">👤 Información del cliente</h3>
                <p><strong>Nombre:</strong> ${customerName}</p>
                <p><strong>Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
              </div>

              <div class="data-box">
                <h3 style="margin-top: 0;">💰 Detalles del pago</h3>
                <p><strong>Monto:</strong> $${amount.toFixed(2)} MXN</p>
                <p><strong>Session ID:</strong> <code>${mockSession.id}</code></p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
              </div>

              <div class="action">
                <h3 style="margin: 0;">⚡ Acción requerida</h3>
                <p style="margin: 10px 0 0 0;">Contacta al cliente para iniciar el onboarding</p>
              </div>

              <p style="color: #666; font-size: 12px;"><strong>Nota:</strong> Este es un email de prueba</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const customerResult = await customerEmailResponse.json();
    const adminResult = await adminEmailResponse.json();

    console.log('✅ Email al cliente enviado:', customerResult);
    console.log('✅ Email al admin enviado:', adminResult);

    return res.status(200).json({
      success: true,
      customerEmail: customerResult,
      adminEmail: adminResult,
    });
  } catch (error: any) {
    console.error('❌ Error enviando emails de prueba:', error);
    return res.status(500).json({ error: error.message });
  }
}
