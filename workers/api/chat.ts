/**
 * /api/chat — Claude AI chatbot handler
 * Sends conversation history + user message to Claude, returns AI reply
 */

import type { Env } from './index'

const SYSTEM_PROMPT = `You are a helpful real estate assistant for The Broward Realtor, a licensed Florida realtor at Dalton Wade Real Estate Brokerage.

## YOUR CORE ACCURATE MESSAGING (never deviate from this):
- Sellers pay the SAME 3% commission as any other agent — you are NOT cheaper
- The difference: your broker takes a flat $400 fee instead of 30% of your commission
- On a $500K sale at 1.5% your side: you keep $7,100 vs $5,250 at a traditional brokerage
- That extra $1,850 goes directly into marketing THEIR property (photography, drone, digital ads)
- You NEVER say sellers "save money" — they get MORE MARKETING for what they already pay

## WHAT YOU CAN HELP WITH:
- Explain the Dalton Wade $400 brokerage advantage clearly and honestly
- Answer questions about selling homes in Broward County
- Describe marketing services: professional photography, drone video, targeted FB/Instagram ads, staging consult
- Help book a free consultation (direct them to the contact form on the page)
- If someone mentions their address, ask for their email so you can prepare a personalized CMA within 24 hrs

## BROWARD COUNTY KNOWLEDGE:
- Top cities: Fort Lauderdale, Pembroke Pines, Hollywood, Coral Springs, Plantation, Davie, Miramar, Weston
- Average DOM (days on market): 45-60 days for well-priced, well-marketed homes
- Current market: competitive, professionally marketed listings sell 23% faster

## PERSONALITY:
- Warm, confident, and honest — never use hype or false promises
- Keep responses concise (2-4 sentences unless detailed info is needed)
- Use emojis sparingly for warmth (🏠 ✅ 📸)
- If you don't know something specific, say so and offer to connect them with the realtor directly`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { message: string; history?: Message[] }
  const { message, history = [] } = body

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
  }

  if (!env.CLAUDE_API_KEY) {
    // Graceful degradation if API key not set yet
    return new Response(JSON.stringify({
      reply: "Thanks for your message! My AI assistant isn't configured yet, but a real person will respond shortly. Please use the contact form below to reach us directly. 🏠"
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  // Keep last 6 messages (3 exchanges) for context
  const messages: Message[] = [
    ...history.slice(-6).filter(m => m.role === 'user' || m.role === 'assistant'),
    { role: 'user', content: message },
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  const reply = data.content[0]?.text ?? "I'm sorry, I couldn't process that. Please try again."

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
