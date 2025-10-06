import type { VercelRequest, VercelResponse } from '@vercel/node';

// Variable de entorno requerida: STRIPE_SECRET_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permite POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔵 Checkout request received');
  console.log('📦 Body:', req.body);

  try {
    const { lineItems } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      console.log('❌ Invalid line items:', lineItems);
      return res.status(400).json({ error: 'Invalid line items' });
    }

    // Verificar que existe la API key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    console.log('🔑 Stripe key found:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');

    // Importar Stripe de forma dinámica
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    console.log('✅ Stripe initialized');
    console.log('📝 Creating session with line items:', JSON.stringify(lineItems, null, 2));

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${req.headers.origin || 'https://acidia.app'}/?success=true`,
      cancel_url: `${req.headers.origin || 'https://acidia.app'}/?canceled=true`,
      billing_address_collection: 'required',
      // Quitar automatic_tax por ahora para evitar errores
      // automatic_tax: { enabled: true },
    });

    console.log('✅ Session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Stripe error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: error?.message || 'Internal server error',
      details: error?.type || 'unknown',
      code: error?.code || 'unknown'
    });
  }
}
