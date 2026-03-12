/**
 * Broward Realtor Chatbot Engine - CORRECTED MESSAGING
 */

const CHATBOT_CONFIG = {
    name: "Broward Realtor Assistant",
    personality: "warm_professional",
    responseTimeout: 2000,
    autoOpenDelay: 10000,

    valueProposition: {
        introduction: "Let me show you something most agents won't tell you about what happens behind the scenes...",
        traditionalProblem: "At a traditional brokerage, my broker takes 30% of my commission before I see a dime. That $4,500+ per deal doesn't go toward marketing YOUR home — it goes to overhead.",
        daltonWadeSolution: "At Dalton Wade, my broker fee is a flat $400 — period. So when I tell you I'm going to invest in professional photography, drone footage, targeted digital ads, and a dedicated marketing plan for your property, I actually have the BUDGET to do it.",
        sellerBenefit: "This means YOUR listing gets better marketing than 95% of other agents can afford. Not because I'm generous — because my brokerage structure lets me invest more without sacrificing my livelihood.",
        closing: "The question isn't whether you can afford to hire me — it's whether you can afford NOT to when every dollar I save on broker fees gets reinvested in selling YOUR home."
    },

    financialComparison: {
        sameCommission: "You pay the SAME 3% commission either way — that's industry standard",
        difference: "The difference is how much I can REINVEST in YOUR listing:",
        traditionalAgent: {
            label: "Traditional Brokerage Agent",
            keepsPerDeal: "$5,250 on $500K sale (after 30% broker split)",
            marketingBudget: "$1,000 - $1,500 typical",
            quality: "Standard photos, basic online ads"
        },
        daltonWadeAgent: {
            label: "Your Dalton Wade Agent (Me)",
            keepsPerDeal: "$7,100 on $500K sale (after $400 flat fee)",
            marketingBudget: "$2,000 - $5,000 available",
            quality: "Professional photography, drone video, targeted ads, staging consult"
        }
    },

    humanTouchElements: [
        "I understand selling your home is a big decision 🏡",
        "Here's what I'd love for you to know...",
        "Most sellers don't realize this until it's too late...",
        "What questions do you have about the process?",
        "Happy to help with that! 👍"
    ],

    flows: {
        welcome: { trigger: true, message: "Hi there! 👋 I'm your Broward Realtor's virtual assistant. What brings you here today?" },
        propertyValue: { keywords: ["value", "worth", "how much", "price", "estimate"], handler: "propertyValuationFlow" },
        marketing: { keywords: ["marketing", "photography", "ads", "promotion", "budget"], handler: "marketingAdvantageFlow" },
        brokerFee: { keywords: ["broker", "fee", "$400", "commission", "split"], handler: "brokerageComparisonFlow" },
        schedule: { keywords: ["call", "meeting", "appointment", "schedule", "talk"], handler: "scheduleFlow" }
    }
};

class BrowardChatBot {
    constructor() {
        this.context = {};
        this.conversationHistory = [];
        this.init();
    }

    init() {
        setTimeout(() => {
            if (document.body.contains(document.getElementById('chatbot-container'))) {
                this.toggleChatWindow(true);
            }
        }, CHATBOT_CONFIG.autoOpenDelay);

        document.getElementById('open-chatbot')?.addEventListener('click', () => this.toggleChatWindow(true));
        document.getElementById('close-chatbot')?.addEventListener('click', () => this.toggleChatWindow(false));
        document.getElementById('send-chat')?.addEventListener('click', () => this.handleUserMessage());
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });

        this.addMessage(CHATBOT_CONFIG.flows.welcome.message, 'bot');
    }

    async handleUserMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        document.getElementById('chat-messages').innerHTML += '<div class="message bot typing">Thinking...</div>';

        setTimeout(async () => {
            const response = await this.processMessage(message);
            this.updateLastMessage(response, 'bot');

            this.conversationHistory.push({
                user: message,
                bot: response,
                timestamp: new Date().toISOString()
            });

            if (this.isHotLead(message)) {
                await this.scheduleCallOffer();
            }
        }, CHATBOT_CONFIG.responseTimeout);
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();

        const addressMatch = this.extractAddress(message);
        if (addressMatch) {
            return await this.handlePropertyValue(addressMatch);
        }

        for (const [key, config] of Object.entries(CHATBOT_CONFIG.flows)) {
            if (config.keywords && config.keywords.some(k => lowerMessage.includes(k))) {
                return this[config.handler](message);
            }
        }

        const humanElement = CHATBOT_CONFIG.humanTouchElements[Math.floor(Math.random() * CHATBOT_CONFIG.humanTouchElements.length)];
        return `${humanElement} How can I help you with selling your Broward home?`;
    }

    async handlePropertyValue(address) {
        this.context.propertyAddress = address;
        await this.saveLeadToDatabase({ address, source: 'chatbot', status: 'valued_request' });
        return `Perfect! Let me check what similar homes have sold for in your area... 🏠\n\nBased on recent sales data, I can give you a FREE detailed valuation. Would you like to see the full breakdown?`;
    }

    marketingAdvantageFlow() {
        return `${CHATBOT_CONFIG.valueProposition.introduction} ${CHATBOT_CONFIG.valueProposition.daltonWadeSolution}\n\n📊 Here's the breakdown on a $500K sale:\n• Traditional Agent keeps: $5,250 after 30% broker split\n• I keep: $7,100 after flat $400 fee\n• That's <strong>$1,850 MORE</strong> to invest in YOUR marketing!\n\nThis means professional photography, drone video, and targeted ads that other agents can't afford.`;
    }

    brokerageComparisonFlow() {
        const comparison = CHATBOT_CONFIG.financialComparison;
        return `🤫 Here's the real difference most sellers miss:\n\n${comparison.sameCommission}\n\nBut ${comparison.difference}:\n\n📋 Traditional Brokerage Agent:\n• Keeps per deal: ${comparison.traditionalAgent.keepsPerDeal}\n• Marketing budget: ~${comparison.traditionalAgent.marketingBudget}\n• Quality: ${comparison.traditionalAgent.quality}\n\n📋 Your Dalton Wade Agent (Me):\n• Keeps per deal: ${comparison.daltonWadeAgent.keepsPerDeal}\n• Marketing budget: ${comparison.daltonWadeAgent.marketingBudget}\n• Quality: ${comparison.daltonWadeAgent.quality}`;
    }

    propertyValuationFlow() {
        return `I'd love to help you get a valuation! Please enter your Broward County address in the form above, or tell me your address here and I'll look it up for you.`;
    }

    scheduleFlow() {
        return `Happy to help with that! 👍 I'd love to connect you with my realtor directly. What works best for you - quick phone call or scheduled Zoom meeting?`;
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = text;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    updateLastMessage(text, sender) {
        const messagesDiv = document.getElementById('chat-messages');
        const lastMsg = messagesDiv.lastElementChild;
        if (lastMsg) {
            lastMsg.innerHTML = text;
            lastMsg.className = `message ${sender}`;
        } else {
            this.addMessage(text, sender);
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    toggleChatWindow(show) {
        const windowEl = document.getElementById('chatbot-window');
        const containerEl = document.getElementById('chatbot-container');
        if (show) {
            windowEl.classList.remove('hidden');
            containerEl.classList.remove('hidden');
        } else {
            windowEl.classList.add('hidden');
        }
    }

    extractAddress(message) {
        const browardPattern = /(\d+\s+[A-Za-z]+(?:\s+Avenue|\s+Street|\s+Drive|\s+Boulevard|\s+Way)?,\s*(?:Fort\s+Lauderdale|Pembroke\s+Pines|Hollywood|Coral\s+Springs|Plantation|Davie))/i;
        const match = message.match(browardPattern);
        return match ? match[0] : null;
    }

    isHotLead(message) {
        const hotKeywords = ['ready', 'sell now', 'urgent', 'call me', 'today', 'this week'];
        return hotKeywords.some(k => message.toLowerCase().includes(k));
    }

    async saveLeadToDatabase(leadData) {
        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
        } catch (error) {
            console.error('Lead save failed:', error);
        }
    }

    async scheduleCallOffer() {
        this.addMessage(`Great! I can have my realtor reach out within the hour. What's your best contact number?`, 'bot');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.browardChatBot = new BrowardChatBot();
});
