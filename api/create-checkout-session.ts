import type { VercelRequest, VercelResponse } from '@vercel/node';

// Instala: npm install stripe
// Variable de entorno requerida: STRIPE_SECRET_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permite POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    // Importar Stripe de forma dinámica
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${req.headers.origin || 'https://acidia.app'}/?success=true`,
      cancel_url: `${req.headers.origin || 'https://acidia.app'}/?canceled=true`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
