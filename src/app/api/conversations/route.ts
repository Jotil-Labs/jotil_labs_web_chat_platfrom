import { isValidUuid } from '@/lib/utils/validation';
import { getLatestConversation, getMessages } from '@/lib/db/queries';
import { corsHeaders, corsResponse } from '@/lib/utils/cors';

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return corsResponse(origin);
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const visitorId = searchParams.get('visitorId');

  if (!clientId || !isValidUuid(clientId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing clientId' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!visitorId || visitorId.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing visitorId' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }

  const conversation = await getLatestConversation(clientId, visitorId);
  if (!conversation) {
    return new Response(
      JSON.stringify({ conversation: null, messages: [] }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }

  const messages = await getMessages(conversation.id);

  return new Response(
    JSON.stringify({
      conversation: {
        id: conversation.id,
        startedAt: conversation.started_at,
        lastMessageAt: conversation.last_message_at,
      },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
        feedback: m.feedback,
      })),
    }),
    {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
  );
}
