import { isValidUuid, isValidFeedback } from '@/lib/utils/validation';
import { setFeedback } from '@/lib/db/queries';
import { corsHeaders, corsResponse } from '@/lib/utils/cors';

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return corsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await req.json();

    if (typeof body.messageId !== 'string' || !isValidUuid(body.messageId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing messageId' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof body.feedback !== 'string' || !isValidFeedback(body.feedback)) {
      return new Response(
        JSON.stringify({ error: 'Feedback must be "positive" or "negative"' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    await setFeedback(body.messageId, body.feedback);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to save feedback' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }
}
