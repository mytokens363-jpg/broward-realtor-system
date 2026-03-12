/**
 * /api/email — Direct email sending endpoint (for future use)
 * Handles transactional emails via Resend
 */

import type { Env } from './index'

const TEMPLATES = {
  valuation_ready: (name: string, address: string) => ({
    subject: `Your CMA is ready — ${address}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#2c5aa0;color:white;padding:30px;text-align:center">
        <h1 style="margin:0">The Broward Realtor</h1>
        <p style="margin:10px 0 0;opacity:0.8">Comparative Market Analysis</p>
      </div>
      <div style="padding:30px">
        <h2>Hi ${name || 'there'},</h2>
        <p>Your personalized CMA for <strong>${address}</strong> is attached to this email.</p>
        <p>Based on recent comparable sales in your area, I've identified the optimal listing price range to get you the best offer in the shortest time.</p>
        <h3 style="color:#2c5aa0">What's Included in Your Free CMA:</h3>
        <ul>
          <li>Recent comparable sales (last 6 months)</li>
          <li>Active listings competing with your property</li>
          <li>Recommended listing price range</li>
          <li>Estimated net proceeds after commission</li>
        </ul>
        <div style="background:#e8f4fd;border-left:4px solid #2c5aa0;padding:20px;margin:20px 0">
          <h4 style="margin:0 0 10px;color:#2c5aa0">The $400 Advantage</h4>
          <p style="margin:0">Unlike agents at traditional brokerages, I keep $1,850 more per deal — money I reinvest in professional photography, drone video, and targeted digital ads for YOUR listing.</p>
        </div>
        <p style="text-align:center;margin-top:30px">
          <a href="https://broward-realtor-system.pages.dev/#contact"
            style="background:#ff6b35;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block">
            Book Your Free Strategy Call
          </a>
        </p>
      </div>
    </div>`,
  }),

  consultation_confirmed: (name: string, date: string) => ({
    subject: `Consultation confirmed — ${date}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
      <h2 style="color:#2c5aa0">Your consultation is confirmed ✅</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Looking forward to speaking with you on <strong>${date}</strong>.</p>
      <p>I'll walk you through exactly how I market listings differently and show you what comparable homes in your area have sold for recently.</p>
      <p>Talk soon!</p>
    </div>`,
  }),
}

export async function handleEmail(request: Request, env: Env): Promise<Response> {
  if (!env.EMAIL_API_KEY) {
    return new Response(JSON.stringify({ error: 'Email service not configured. Add EMAIL_API_KEY to Worker variables.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { to, template, data = {} } = await request.json() as {
    to: string
    template: keyof typeof TEMPLATES
    data: Record<string, string>
  }

  if (!to || !template) {
    return new Response(JSON.stringify({ error: 'to and template required' }), { status: 400 })
  }

  const builder = TEMPLATES[template]
  if (!builder) {
    return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), { status: 400 })
  }

  const { subject, html } = builder(data.name, data.address || data.date || '')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Broward Realtor <hello@thebrowardrealtor.com>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }

  const result = await res.json()
  return new Response(JSON.stringify({ success: true, id: (result as Record<string, unknown>).id }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
