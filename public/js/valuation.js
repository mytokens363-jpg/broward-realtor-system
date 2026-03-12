/**
 * Property Valuation Tool - Broward County Real Estate
 */

const VALUATION_CONFIG = {
    validZipCodes: ['33060','33061','33062','33063','33064','33065','33066','33067','33068','33069','33071','33073','33076','33301','33302','33304','33305','33306','33308','33309','33311','33312','33313','33314','33315','33316','33317','33319','33321','33322','33323','33324','33325','33326','33327','33328','33330','33331','33332','33334','33351'],
    marketAdjustments: {
        inventoryLevel: 'balanced',
        averageDaysOnMarket: 45,
        pricePerSqFtRange: {
            fortLauderdale: { min: 350, max: 800 },
            pembrokePines: { min: 250, max: 600 }
        }
    }
};

class PropertyValuationTool {
    constructor() { this.setupEventListeners(); }

    setupEventListeners() {
        document.getElementById('valuation-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleValuationRequest(e.target);
        });
    }

    async handleValuationRequest(form) {
        const address = form.querySelector('input[type="text"]').value.trim();

        if (!this.validateBrowardAddress(address)) {
            this.showError("Please enter a valid Broward County property address.");
            return;
        }

        const btn = form.querySelector('button');
        btn.textContent = 'Analyzing Market Data...';
        btn.disabled = true;

        try {
            const valuationData = await this.fetchValuationData(address);
            this.displayValuationResults(valuationData, address);
            await this.captureLeadForValuation(address, valuationData.estimateRange);
        } catch (error) {
            console.error('Valuation failed:', error);
            this.showError("Unable to retrieve property data. Please try again.");
        } finally {
            btn.textContent = 'Get Valuation';
            btn.disabled = false;
        }
    }

    async fetchValuationData(address) {
        const mockData = [{ estimate: 485000 }, { estimate: 475000 }, { estimate: 492000 }];
        const avgEstimate = mockData.reduce((sum, d) => sum + d.estimate, 0) / mockData.length;

        return {
            estimateRange: { low: avgEstimate * 0.95, high: avgEstimate * 1.05, estimated: avgEstimate },
            comparables: [{ address: 'Nearby Sale 1', price: 472000, date: '2026-01-15' }],
            propertyDetails: { address, squareFeet: 2400, bedrooms: 4, bathrooms: 3 },
            marketTrends: { daysOnMarket: 45, pricePerSqFt: 380, inventoryStatus: 'balanced' }
        };
    }

    validateBrowardAddress(address) {
        const browardKeywords = ['Fort Lauderdale', 'Pembroke Pines', 'Hollywood', 'Coral Springs', 'Plantation', 'Davie', '333', '330'];
        return browardKeywords.some(k => address.toLowerCase().includes(k.toLowerCase()));
    }

    captureLeadForValuation(address, estimateRange) {
        fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'property_valuation_tool',
                address,
                property_value_estimate: Math.round(estimateRange.estimated),
                status: 'valued_request'
            })
        });
    }

    displayValuationResults(data, address) {
        const resultDiv = document.getElementById('valuation-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = `
            <div class="valuation-card">
                <h3>Property Valuation for: ${address}</h3>
                <div class="estimate-box">
                    <span class="label">Estimated Value Range</span><br>
                    <span class="value" style="font-size: 1.5em; color: #2c5aa0;">
                        $${(data.estimateRange.low / 1000).toFixed(0)}K - $${(data.estimateRange.high / 1000).toFixed(0)}K
                    </span>
                </div>
                <div class="market-details">
                    <p><strong>Property Size:</strong> ~${data.propertyDetails.squareFeet.toLocaleString()} sq ft</p>
                    <p><strong>Bedrooms:</strong> ${data.propertyDetails.bedrooms}</p>
                    <p><strong>Bathrooms:</strong> ${data.propertyDetails.bathrooms}</p>
                    <p><strong>Days on Market (Area):</strong> ${data.marketTrends.daysOnMarket} days</p>
                    <p><strong>Price per Sq Ft:</strong> $${data.marketTrends.pricePerSqFt.toLocaleString()}</p>
                </div>
                <div class="cta-section">
                    <p><em>This is an estimate based on recent comparable sales.</em></p>
                    <button onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})"
                        style="background:#2c5aa0;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;">
                        Schedule Detailed Market Analysis
                    </button>
                </div>
            </div>
        `;

        resultDiv.classList.remove('hidden');
        document.getElementById('valuation-tool').scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        const form = document.getElementById('valuation-form');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff6b35';
        errorDiv.style.marginTop = '10px';
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.propertyValuationTool = new PropertyValuationTool();
});
