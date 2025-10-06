import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, replyTo } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AcidIA <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        reply_to: replyTo || process.env.ADMIN_EMAIL || 'luisu.dev@gmail.com',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email' });
    }

    console.log('✅ Email sent:', data.id);
    return res.status(200).json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({ error: error.message });
  }
}
