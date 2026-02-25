import { isValidUuid, isValidOrigin } from '@/lib/utils/validation';
import { getActiveClient } from '@/lib/db/queries';
import { corsHeaders, corsResponse } from '@/lib/utils/cors';
import type { WidgetConfig } from '@/types';

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return corsResponse(origin);
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  if (!clientId || !isValidUuid(clientId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing clientId' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }

  const client = await getActiveClient(clientId);
  if (!client) {
    return new Response(
      JSON.stringify({ error: 'Client not found or inactive' }),
      {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!isValidOrigin(origin, client.domain)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const c = client.customization ?? {};
  const config: WidgetConfig = {
    botName: client.bot_name,
    welcomeMessage: client.welcome_message,
    primaryColor: client.primary_color,
    borderRadius: client.border_radius,
    position: client.position,
    bubbleIconUrl: c.bubbleIconUrl ?? null,
    logoUrl: c.logoUrl ?? null,
    greetingMessage: c.greetingMessage ?? null,
    glowEffect: c.glowEffect ?? false,
  };

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
