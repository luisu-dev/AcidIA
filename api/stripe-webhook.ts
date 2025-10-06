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
    await fetch(process.env.VITE_CONTACT_ENDPOINT || 'https://acidia.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerEmail,
        subject: '✅ Pago confirmado - AcidIA',
        html: `
          <h2>¡Gracias por tu compra, ${customerName}!</h2>
          <p>Tu pago de <strong>$${amount} MXN</strong> ha sido procesado correctamente.</p>
          <p>Nos pondremos en contacto contigo pronto para comenzar con el onboarding.</p>
          <hr>
          <p><small>Este es un correo automático de AcidIA</small></p>
        `,
      }),
    });

    // 2. Notificar al equipo de AcidIA
    await fetch(process.env.VITE_CONTACT_ENDPOINT || 'https://acidia.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ADMIN_EMAIL || 'luisu.dev@gmail.com',
        subject: '🎉 Nuevo cliente - AcidIA',
        html: `
          <h2>Nuevo pago recibido</h2>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Monto:</strong> $${amount} MXN</p>
          <p><strong>Session ID:</strong> ${session.id}</p>
          <hr>
          <p>Contacta al cliente para iniciar el onboarding.</p>
        `,
      }),
    });

    console.log('✅ Correos enviados exitosamente');
  } catch (error) {
    console.error('❌ Error enviando correos:', error);
  }
}
