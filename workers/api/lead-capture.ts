/** Cloudflare Worker - Lead Capture API */

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/api/leads' && request.method === 'POST') {
            try {
                const data = await request.json();

                // TODO: Connect to Neon PostgreSQL database
                console.log('Lead captured:', data);

                return new Response(JSON.stringify({ success: true, id: 1 }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Failed to save lead' }), { status: 500 });
            }
        }

        return new Response('API endpoint not found', { status: 404 });
    }
};
