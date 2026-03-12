#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   THE BROWARD REALTOR SYSTEM - DEPLOYMENT        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"

# 1. Check prerequisites
echo -e "\n${YELLOW}Step 1: Checking requirements...${NC}"
which node >/dev/null || { echo -e "${RED}Node.js not found${NC}"; exit 1; }
which npm >/dev/null || { echo -e "${RED}npm not found${NC}"; exit 1; }
echo -e "  ${GREEN}✓${NC} Node & npm installed"

# 2. Install dependencies
echo -e "\n${YELLOW}Step 2: Installing npm dependencies...${NC}"
npm install

# 3. Check for Wrangler CLI
echo -e "\n${YELLOW}Step 3: Checking Cloudflare Wrangler...${NC}"
which wrangler >/dev/null || { echo "Install with: npm install -g wrangler"; exit 1; }
echo -e "  ${GREEN}✓${NC} Wrangler CLI ready"

# 4. Cloudflare login check
echo -e "\n${YELLOW}Step 4: Cloudflare authentication...${NC}"
if ! wrangler whoami &>/dev/null; then
    echo "Not logged into Cloudflare. Run 'wrangler login' first."
    read -p "Press Enter after logging in..."
fi

# 5. Deploy to Pages (frontend)
echo -e "\n${YELLOW}Step 5: Deploying frontend to Cloudflare Pages...${NC}"
read -p "Deploy public/ folder? (y/n): " DEPLOY_CONFIRM
if [ "$DEPLOY_CONFIRM" = "y" ]; then
    wrangler pages deploy public/ --project-name=broward-realtor-system
    echo -e "  ${GREEN}✓${NC} Frontend deployed!"
else
    echo -e "  ${YELLOW}⚠${NC} Skipping Pages deployment"
fi

# 6. Environment variables setup reminder
echo -e "\n${YELLOW}Step 6: Environment Variables Setup Required${NC}"
echo "Go to https://dash.cloudflare.com > Workers & Pages > broward-realtor-api"
echo "Add these in Settings > Variables:"
echo "  CLAUDE_API_KEY = sk-ant-api03-your-key-here"
echo "  EMAIL_API_KEY  = re_your-email-key-here"
echo "  NEON_DATABASE_URL = postgres://your-neon-db-url"

# 7. DNS configuration reminder
echo -e "\n${YELLOW}Step 7: DNS Configuration Required${NC}"
echo "Add these CNAME records in Cloudflare DNS for thebrowardrealtor.com:"
echo "  *   → broward-realtor-system.pages.dev"
echo "  www → broward-realtor-system.pages.dev"
echo ""
echo "Wait 30 minutes for DNS propagation..."

# Summary
echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         DEPLOYMENT COMPLETE! 🎉                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Add API keys to Cloudflare Worker variables"
echo "2. Configure DNS records (30 min wait)"
echo "3. Test at: https://broward-realtor-system.pages.dev"
echo "4. Update domain to thebrowardrealtor.com after propagation"
