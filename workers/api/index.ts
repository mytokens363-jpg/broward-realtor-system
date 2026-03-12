/**
 * Broward Realtor System — Cloudflare Worker Entry Point
 * Routes: /api/chat, /api/leads, /api/email
 */

import { handleChat } from './chat'
import { handleLeads } from './leads'
import { handleEmail } from './email'

export interface Env {
  CLAUDE_API_KEY: string
  NEON_DATABASE_URL: string
  EMAIL_API_KEY: string
  REALTOR_EMAIL: string  // your personal email for lead alerts
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(request.url)

    try {
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env)
      }
      if (url.pathname === '/api/leads' && request.method === 'POST') {
        return await handleLeads(request, env)
      }
      if (url.pathname === '/api/email' && request.method === 'POST') {
        return await handleEmail(request, env)
      }
      return json({ error: 'Not found' }, 404)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return json({ error: msg }, 500)
    }
  },
}
