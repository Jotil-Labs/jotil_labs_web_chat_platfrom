import type { ChatRequest, Feedback } from '@/types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidMessage(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length >= 1 && trimmed.length <= 1000;
}

export function isValidOrigin(
  origin: string | null,
  clientDomain: string
): boolean {
  if (!origin) return false;

  // Allow localhost in development
  if (
    clientDomain === 'localhost' &&
    (origin.includes('localhost') || origin.includes('127.0.0.1'))
  ) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.hostname === clientDomain || url.hostname.endsWith(`.${clientDomain}`);
  } catch {
    return false;
  }
}

export function isValidFeedback(
  feedback: string
): feedback is Feedback {
  return feedback === 'positive' || feedback === 'negative';
}

interface ValidationSuccess {
  valid: true;
  data: ChatRequest;
}

interface ValidationError {
  valid: false;
  error: string;
}

export function validateChatRequest(
  body: unknown
): ValidationSuccess | ValidationError {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.clientId !== 'string' || !isValidUuid(b.clientId)) {
    return { valid: false, error: 'Invalid or missing clientId' };
  }

  if (typeof b.visitorId !== 'string' || b.visitorId.length === 0) {
    return { valid: false, error: 'Invalid or missing visitorId' };
  }

  if (typeof b.message !== 'string' || !isValidMessage(b.message)) {
    return {
      valid: false,
      error: 'Message must be between 1 and 1000 characters',
    };
  }

  if (
    b.conversationId !== null &&
    b.conversationId !== undefined &&
    (typeof b.conversationId !== 'string' || !isValidUuid(b.conversationId))
  ) {
    return { valid: false, error: 'Invalid conversationId' };
  }

  if (!Array.isArray(b.history)) {
    return { valid: false, error: 'History must be an array' };
  }

  const history = b.history as Array<Record<string, unknown>>;
  for (const msg of history) {
    if (
      typeof msg.role !== 'string' ||
      (msg.role !== 'user' && msg.role !== 'assistant')
    ) {
      return { valid: false, error: 'Invalid message role in history' };
    }
    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Invalid message content in history' };
    }
  }

  return {
    valid: true,
    data: {
      clientId: b.clientId,
      conversationId: (b.conversationId as string) ?? null,
      visitorId: b.visitorId,
      message: (b.message as string).trim(),
      history: history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      })),
    },
  };
}
