import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Este endpoint recibe notificaciones de Stripe cuando ocurren eventos
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
  });

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Verificar que el evento viene de Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('✅ Webhook recibido:', event.type);

  // Manejar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('💰 Pago completado:', {
        sessionId: session.id,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total,
      });

      // Aquí enviarías los correos
      await handleSuccessfulPayment(session);
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('📅 Suscripción creada:', subscription.id);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('🔄 Suscripción actualizada:', subscription.id);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('🧾 Factura pagada:', invoice.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('❌ Pago fallido:', invoice.id);
      break;
    }

    default:
      console.log(`ℹ️ Evento no manejado: ${event.type}`);
  }

  res.status(200).json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const amount = session.amount_total! / 100; // Convertir de centavos a pesos

  console.log('📧 Preparando correos para:', {
    email: customerEmail,
    name: customerName,
    amount: `$${amount} MXN`,
  });

  // Aquí integrarías tu servicio de correo (Resend, SendGrid, etc.)
  // Ejemplo con fetch a tu endpoint de correos:

  try {
    // 1. Enviar recibo al cliente
    await fetch('https://acidia.app/api/send-email', {
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
                  <p><strong>ID de transacción:</strong> ${session.id}</p>
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

    // 2. Notificar al equipo de AcidIA
    await fetch('https://acidia.app/api/send-email', {
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
                <p><strong>Session ID:</strong> <code>${session.id}</code></p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
              </div>

              <div class="action">
                <h3 style="margin: 0;">⚡ Acción requerida</h3>
                <p style="margin: 10px 0 0 0;">Contacta al cliente para iniciar el onboarding</p>
              </div>

              <p style="color: #666; font-size: 12px;">Ver detalles completos en el <a href="https://dashboard.stripe.com/payments/${session.payment_intent}">Dashboard de Stripe</a></p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    console.log('✅ Correos enviados exitosamente');
  } catch (error) {
    console.error('❌ Error enviando correos:', error);
  }
}
