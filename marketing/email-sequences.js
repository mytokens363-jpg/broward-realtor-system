/**
 * Broward Realtor — Email Marketing Automation
 * Uses Resend API (resend.com) — free tier: 3,000 emails/month
 *
 * Setup:
 *   1. Create account at resend.com
 *   2. Get API key (starts with re_...)
 *   3. Set EMAIL_API_KEY in Cloudflare Worker variables
 *   4. Verify your sending domain (thebrowardrealtor.com) in Resend dashboard
 */

const RESEND_API = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'The Broward Realtor <hello@thebrowardrealtor.com>'

export default class EmailService {
  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async send(to, subject, html) {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Resend failed: ${err}`)
    }
    return response.json()
  }

  // ── Sequence 1: Instant Valuation Follow-Up ─────────────────────
  // Trigger: when visitor submits valuation form
  async sendValuationFollowUp(lead) {
    const { email, name, address } = lead
    const firstName = (name || '').split(' ')[0] || 'there'

    return this.send(
      email,
      `Your Broward home valuation — what happens next`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2c5aa0;color:white;padding:30px;text-align:center">
          <h1 style="margin:0;font-size:24px">The Broward Realtor</h1>
        </div>
        <div style="padding:30px">
          <h2>Hi ${firstName},</h2>
          <p>You just requested a valuation for <strong>${address || 'your Broward property'}</strong>.</p>
          <p>I'm preparing a personalized Comparative Market Analysis (CMA) — a real one, based on actual recent sales in your neighborhood, not just an algorithm estimate.</p>
          <p><strong>You'll receive it within 24 hours.</strong></p>
          <hr style="border:none;border-top:1px solid #eee;margin:25px 0">
          <h3 style="color:#2c5aa0">While you wait — here's something most agents won't tell you:</h3>
          <p>The commission you pay is the same 3% regardless of which agent you hire. But the difference is what your agent can <em>afford</em> to invest in marketing your home.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr style="background:#f5f5f5">
              <th style="padding:12px;text-align:left;border:1px solid #ddd"></th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd">Traditional Agent</th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd;background:#e8f4fd;color:#2c5aa0">Your Broward Realtor</th>
            </tr>
            <tr>
              <td style="padding:12px;border:1px solid #ddd">Broker fee</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd">30% of commission</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd;background:#e8f4fd"><strong>$400 flat</strong></td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:12px;border:1px solid #ddd">Agent keeps (on $500K sale)</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd">$5,250</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd;background:#e8f4fd"><strong>$7,100</strong></td>
            </tr>
            <tr>
              <td style="padding:12px;border:1px solid #ddd">Available for your marketing</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd">$500–1,500</td>
              <td style="padding:12px;text-align:center;border:1px solid #ddd;background:#e8f4fd"><strong>$2,000–5,000</strong></td>
            </tr>
          </table>
          <p style="text-align:center;margin-top:25px">
            <a href="https://broward-realtor-system.pages.dev/#contact"
              style="background:#ff6b35;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-size:16px;display:inline-block">
              Schedule Your Free Strategy Call →
            </a>
          </p>
        </div>
        <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#999">
          The Broward Realtor · Dalton Wade Real Estate Brokerage · Licensed FL Realtor<br>
          <a href="#" style="color:#999">Unsubscribe</a>
        </div>
      </div>`
    )
  }

  // ── Sequence 2: Day 3 Market Insights ───────────────────────────
  // Trigger: 3 days after initial contact
  async sendMarketInsights(lead) {
    const { email, name } = lead
    const firstName = (name || '').split(' ')[0] || 'there'

    return this.send(
      email,
      `Broward County market update — what sellers need to know in 2026`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
        <h2 style="color:#2c5aa0">Broward Market Update — March 2026</h2>
        <p>Hi ${firstName},</p>
        <p>A quick update on what's happening in the Broward market right now:</p>
        <ul style="line-height:2">
          <li><strong>Average days on market:</strong> 45-55 days for competitively priced homes</li>
          <li><strong>Professionally marketed homes</strong> sell 23% faster on average</li>
          <li><strong>Staging + professional photos</strong> can add 6-10% to your sale price</li>
          <li><strong>Inventory:</strong> Balanced — well-presented listings still get multiple offers</li>
        </ul>
        <p>The sellers who win right now are those with agents who invest in proper marketing — not just an MLS listing and some phone photos.</p>
        <p style="text-align:center;margin-top:25px">
          <a href="https://broward-realtor-system.pages.dev/#contact"
            style="background:#2c5aa0;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block">
            Let's Talk Strategy →
          </a>
        </p>
      </div>`
    )
  }
}
