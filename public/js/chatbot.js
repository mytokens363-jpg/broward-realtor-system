/**
 * Broward Realtor Chatbot — calls /api/chat (Claude AI backend)
 */

class BrowardChatBot {
  constructor() {
    this.history = []   // { role, content } conversation history sent to API
    this.init()
  }

  init() {
    document.getElementById('open-chatbot')?.addEventListener('click', () => this.open())
    document.getElementById('close-chatbot')?.addEventListener('click', () => this.close())
    document.getElementById('send-chat')?.addEventListener('click', () => this.send())
    document.getElementById('chat-input')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.send()
    })

    // Auto-open after 12 seconds
    setTimeout(() => {
      const container = document.getElementById('chatbot-container')
      if (container) {
        container.classList.remove('hidden')
        // Don't auto-open window, just show the trigger button
      }
    }, 12000)

    // Show trigger button immediately (window stays closed)
    document.getElementById('chatbot-container')?.classList.remove('hidden')

    this.addMessage('Hi! 👋 I\'m the Broward Realtor assistant. Ask me anything about selling your home — I\'ll give you honest answers.', 'bot')
  }

  open() {
    document.getElementById('chatbot-window')?.classList.remove('hidden')
    document.getElementById('chat-input')?.focus()
  }

  close() {
    document.getElementById('chatbot-window')?.classList.add('hidden')
  }

  async send() {
    const input = document.getElementById('chat-input')
    const message = input.value.trim()
    if (!message) return

    this.addMessage(message, 'user')
    input.value = ''
    input.disabled = true

    // Show typing indicator
    const typingId = 'typing-' + Date.now()
    this.addMessage('...', 'bot typing', typingId)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: this.history }),
      })

      const data = await response.json()
      const reply = data.reply || "Sorry, I couldn't get a response. Please try again."

      // Replace typing indicator with real reply
      this.replaceMessage(typingId, reply, 'bot')

      // Save to history for context
      this.history.push({ role: 'user', content: message })
      this.history.push({ role: 'assistant', content: reply })

      // Auto-save lead if address detected in message
      const address = this.extractAddress(message)
      if (address) {
        this.saveLeadSilently({ address, source: 'chatbot', status: 'chatbot_address' })
      }

    } catch (err) {
      console.error('Chat error:', err)
      this.replaceMessage(typingId, "Something went wrong. Please try the contact form below. 🏠", 'bot')
    } finally {
      input.disabled = false
      input.focus()
    }
  }

  addMessage(text, type, id = null) {
    const msgs = document.getElementById('chat-messages')
    const div = document.createElement('div')
    div.className = `message ${type}`
    div.innerHTML = text.replace(/\n/g, '<br>')
    if (id) div.id = id
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
  }

  replaceMessage(id, text, type) {
    const el = document.getElementById(id)
    if (el) {
      el.className = `message ${type}`
      el.innerHTML = text.replace(/\n/g, '<br>')
      document.getElementById('chat-messages').scrollTop = 99999
    } else {
      this.addMessage(text, type)
    }
  }

  extractAddress(text) {
    const m = text.match(/\d+\s+[A-Za-z\s]+(?:Ave|Avenue|St|Street|Dr|Drive|Blvd|Boulevard|Way|Rd|Road|Ln|Lane)[,\s]+(?:Fort Lauderdale|Pembroke Pines|Hollywood|Coral Springs|Plantation|Davie|Miramar|Weston)/i)
    return m ? m[0] : null
  }

  saveLeadSilently(data) {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {}) // silent fail
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.browardChatBot = new BrowardChatBot()
})
