import { describe, it, expect } from 'vitest';
import {
  isValidUuid,
  isValidMessage,
  isValidOrigin,
  isValidFeedback,
  validateChatRequest,
} from './validation';

describe('isValidUuid', () => {
  it('accepts valid UUID v4', () => {
    expect(isValidUuid('00000000-0000-0000-0000-000000000001')).toBe(true);
    expect(isValidUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('12345')).toBe(false);
    expect(isValidUuid('00000000-0000-0000-0000')).toBe(false);
  });
});

describe('isValidMessage', () => {
  it('accepts valid messages', () => {
    expect(isValidMessage('Hello')).toBe(true);
    expect(isValidMessage('a')).toBe(true);
    expect(isValidMessage('x'.repeat(1000))).toBe(true);
  });

  it('rejects empty and too-long messages', () => {
    expect(isValidMessage('')).toBe(false);
    expect(isValidMessage('   ')).toBe(false);
    expect(isValidMessage('x'.repeat(1001))).toBe(false);
  });
});

describe('isValidOrigin', () => {
  it('matches exact domain', () => {
    expect(isValidOrigin('https://example.com', 'example.com')).toBe(true);
  });

  it('matches subdomain', () => {
    expect(isValidOrigin('https://www.example.com', 'example.com')).toBe(true);
  });

  it('rejects different domain', () => {
    expect(isValidOrigin('https://evil.com', 'example.com')).toBe(false);
  });

  it('allows localhost in development', () => {
    expect(isValidOrigin('http://localhost:3000', 'localhost')).toBe(true);
    expect(isValidOrigin('http://127.0.0.1:3000', 'localhost')).toBe(true);
  });

  it('rejects null origin', () => {
    expect(isValidOrigin(null, 'example.com')).toBe(false);
  });
});

describe('isValidFeedback', () => {
  it('accepts positive and negative', () => {
    expect(isValidFeedback('positive')).toBe(true);
    expect(isValidFeedback('negative')).toBe(true);
  });

  it('rejects other values', () => {
    expect(isValidFeedback('neutral')).toBe(false);
    expect(isValidFeedback('')).toBe(false);
  });
});

describe('validateChatRequest', () => {
  const validRequest = {
    clientId: '00000000-0000-0000-0000-000000000001',
    visitorId: 'visitor-123',
    message: 'Hello',
    conversationId: null,
    history: [],
  };

  it('validates a correct request', () => {
    const result = validateChatRequest(validRequest);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.clientId).toBe(validRequest.clientId);
      expect(result.data.message).toBe('Hello');
    }
  });

  it('rejects missing clientId', () => {
    const result = validateChatRequest({ ...validRequest, clientId: undefined });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid clientId', () => {
    const result = validateChatRequest({ ...validRequest, clientId: 'bad' });
    expect(result.valid).toBe(false);
  });

  it('rejects empty message', () => {
    const result = validateChatRequest({ ...validRequest, message: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects message over 1000 chars', () => {
    const result = validateChatRequest({
      ...validRequest,
      message: 'x'.repeat(1001),
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid history entries', () => {
    const result = validateChatRequest({
      ...validRequest,
      history: [{ role: 'invalid', content: 'test' }],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid history', () => {
    const result = validateChatRequest({
      ...validRequest,
      history: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('trims message whitespace', () => {
    const result = validateChatRequest({
      ...validRequest,
      message: '  Hello  ',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.message).toBe('Hello');
    }
  });
});
