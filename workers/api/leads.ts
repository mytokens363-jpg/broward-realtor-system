/**
 * /api/leads — Lead capture + Neon PostgreSQL storage
 * Saves lead to DB, triggers email alert to realtor + follow-up to lead
 */

import type { Env } from './index'

interface LeadData {
  name?: string
  email?: string
  phone?: string
  address?: string
  property_value_estimate?: number
  source?: string
  status?: string
  message?: string
}

export async function handleLeads(request: Request, env: Env): Promise<Response> {
  const data = await request.json() as LeadData

  // Always require at least email or address to be useful
  if (!data.email && !data.address) {
    return new Response(JSON.stringify({ error: 'Email or address required' }), { status: 400 })
  }

  const lead = {
    name: data.name || null,
    email: data.email || 'unknown@placeholder.com',
    phone: data.phone || null,
    address: data.address || null,
    property_value_estimate: data.property_value_estimate || null,
    source: data.source || 'website',
    status: data.status || 'new',
  }

  // ── Save to Neon PostgreSQL ─────────────────────────────────────
  if (env.NEON_DATABASE_URL) {
    try {
      // Use Neon serverless HTTP endpoint directly (no WebSocket needed)
      const dbUrl = new URL(env.NEON_DATABASE_URL)
      const neonHttpUrl = `https://${dbUrl.hostname}/sql`
      const authToken = `${dbUrl.username}:${dbUrl.password}`

      const query = `
        INSERT INTO leads (name, email, phone, address, property_value_estimate, source, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, leads.name),
          phone = COALESCE(EXCLUDED.phone, leads.phone),
          address = COALESCE(EXCLUDED.address, leads.address),
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING id
      `

      await fetch(neonHttpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(authToken)}`,
          'Neon-Connection-String': env.NEON_DATABASE_URL,
        },
        body: JSON.stringify({
          query,
          params: [
            lead.name, lead.email, lead.phone, lead.address,
            lead.property_value_estimate, lead.source, lead.status,
          ],
        }),
      })
    } catch (err) {
      console.error('DB insert failed (non-fatal):', err)
    }
  }

  // ── Send email alert to realtor ─────────────────────────────────
  if (env.EMAIL_API_KEY && env.REALTOR_EMAIL) {
    try {
      await sendRealtorAlert(env, lead, data.message)
    } catch (err) {
      console.error('Realtor alert failed (non-fatal):', err)
    }
  }

  // ── Send follow-up email to lead (if they provided email) ───────
  if (env.EMAIL_API_KEY && data.email && data.source !== 'contact_form') {
    try {
      await sendLeadFollowUp(env, lead)
    } catch (err) {
      console.error('Lead follow-up failed (non-fatal):', err)
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

async function sendRealtorAlert(env: Env, lead: LeadData, message?: string) {
  const rows = [
    ['Source', lead.source || '—'],
    ['Name', lead.name || '—'],
    ['Email', lead.email || '—'],
    ['Phone', lead.phone || '—'],
    ['Address', lead.address || '—'],
    ['Est. Value', lead.property_value_estimate ? `$${lead.property_value_estimate.toLocaleString()}` : '—'],
    ['Message', message || '—'],
  ].map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;width:120px">${k}</td><td style="padding:8px;border-bottom:1px solid #ddd">${v}</td></tr>`).join('')

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Broward Realtor System <alerts@thebrowardrealtor.com>',
      to: [env.REALTOR_EMAIL],
      subject: `🏠 New Lead — ${lead.source} — ${lead.name || lead.email || lead.address}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
        <h2 style="color:#2c5aa0">New Lead Captured</h2>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="margin-top:20px;color:#666;font-size:12px">Broward Realtor System — respond within 1 hour for best conversion</p>
      </div>`,
    }),
  })
}

async function sendLeadFollowUp(env: Env, lead: LeadData) {
  const firstName = (lead.name || '').split(' ')[0] || 'there'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'The Broward Realtor <hello@thebrowardrealtor.com>',
      to: [lead.email!],
      subject: `Your Broward property inquiry — next steps`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2c5aa0;color:white;padding:30px;text-align:center">
          <h1 style="margin:0">The Broward Realtor</h1>
        </div>
        <div style="padding:30px">
          <h2>Hi ${firstName},</h2>
          <p>Thanks for reaching out${lead.address ? ` about <strong>${lead.address}</strong>` : ''}!</p>
          <p>I'll be in touch within <strong>1 business hour</strong> to discuss next steps.</p>
          <h3 style="color:#2c5aa0">Why Sellers Choose Me:</h3>
          <ul>
            <li>My broker charges a flat <strong>$400 fee</strong> (not 30% like traditional brokerages)</li>
            <li>On a $500K sale, that's <strong>$1,850 more</strong> I can invest in your listing</li>
            <li>Result: professional photography, drone video, and targeted digital ads included</li>
          </ul>
          <p style="text-align:center;margin-top:30px">
            <a href="https://broward-realtor-system.pages.dev/#contact"
              style="background:#ff6b35;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block">
              Schedule Your Free Consultation
            </a>
          </p>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#666">
          The Broward Realtor | Dalton Wade Real Estate Brokerage | Licensed FL Realtor
        </div>
      </div>`,
    }),
  })
}
