import { validateChatRequest, isValidOrigin } from '@/lib/utils/validation';
import {
  checkVisitorRateLimit,
  checkClientMonthlyLimit,
} from '@/lib/utils/rate-limit';
import { getActiveClient, createConversation, saveMessage, updateConversationTimestamp, incrementUsage } from '@/lib/db/queries';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { streamChatResponse } from '@/lib/ai/providers';
import { createMockStreamResponse } from '@/lib/ai/mock';
import { corsHeaders, corsResponse } from '@/lib/utils/cors';
import type { ClientConfig, ChatMessage } from '@/types';

export const runtime = 'edge';

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return corsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await req.json();
    const validation = validateChatRequest(body);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { clientId, conversationId, visitorId, message, history } =
      validation.data;

    // Fetch and validate client
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

    // Origin validation
    if (!isValidOrigin(origin, client.domain)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Per-visitor rate limit
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';
    const rateLimit = checkVisitorRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many messages. Please wait a moment.',
        }),
        {
          status: 429,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter ?? 60),
          },
        }
      );
    }

    // Monthly limit
    if (!checkClientMonthlyLimit(client.messages_used, client.message_limit)) {
      return new Response(
        JSON.stringify({
          error: 'This chat is temporarily unavailable. Please contact the business directly.',
        }),
        {
          status: 429,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create or resume conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conversation = await createConversation(clientId, visitorId);
      activeConversationId = conversation.id;
    }

    // Build system prompt
    const clientConfig: ClientConfig = {
      name: client.name,
      botName: client.bot_name,
      systemPrompt: client.system_prompt,
      documentContext: client.document_context,
    };
    const systemPrompt = buildSystemPrompt(clientConfig);

    // Build messages for AI
    const messages: ChatMessage[] = [
      ...history.slice(-20),
      { role: 'user', content: message },
    ];

    // Mock mode
    if (process.env.MOCK_AI === 'true') {
      const mockResponse = createMockStreamResponse();
      const mockHeaders = new Headers(mockResponse.headers);
      Object.entries(headers).forEach(([k, v]) => mockHeaders.set(k, v));
      mockHeaders.set('X-Conversation-Id', activeConversationId);

      // Persist messages in background
      persistMessages(activeConversationId, message, client.ai_model, clientId);

      return new Response(mockResponse.body, {
        status: 200,
        headers: mockHeaders,
      });
    }

    // Stream AI response
    const result = streamChatResponse(
      client.ai_model,
      systemPrompt,
      messages
    );

    const response = result.toDataStreamResponse();

    // Persist messages after stream completes
    result.text.then(async (fullText) => {
      const usage = await result.usage;
      try {
        await saveMessage({
          conversationId: activeConversationId!,
          role: 'user',
          content: message,
        });
        await saveMessage({
          conversationId: activeConversationId!,
          role: 'assistant',
          content: fullText,
          modelUsed: client.ai_model,
          tokensUsed: usage?.totalTokens,
        });
        await updateConversationTimestamp(activeConversationId!);
        await incrementUsage(clientId);
      } catch {
        // Log but don't fail the stream
      }
    });

    // Add CORS and conversation ID headers
    const responseHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v));
    responseHeaders.set('X-Conversation-Id', activeConversationId);

    return new Response(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function persistMessages(
  conversationId: string,
  userMessage: string,
  model: string,
  clientId: string
) {
  try {
    await saveMessage({
      conversationId,
      role: 'user',
      content: userMessage,
    });
    // Mock assistant message for persistence
    await saveMessage({
      conversationId,
      role: 'assistant',
      content: '[Mock response]',
      modelUsed: model,
      tokensUsed: 85,
    });
    await updateConversationTimestamp(conversationId);
    await incrementUsage(clientId);
  } catch {
    // Silently fail persistence in mock mode
  }
}
