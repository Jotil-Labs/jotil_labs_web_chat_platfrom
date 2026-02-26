import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  const baseClient = {
    name: 'Acme Corp',
    botName: 'Acme Bot',
    systemPrompt: 'You are an AI assistant for Acme Corp.\n\nAbout the business:\nAcme Corp sells widgets.',
    documentContext: null,
  };

  it('returns the system prompt from the database as-is', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).toBe(baseClient.systemPrompt);
  });

  it('appends document context when provided', () => {
    const client = {
      ...baseClient,
      documentContext: 'We sell premium widgets and gadgets.',
    };
    const result = buildSystemPrompt(client);
    expect(result).toContain(client.systemPrompt);
    expect(result).toContain('We sell premium widgets and gadgets.');
  });

  it('separates document context with a divider', () => {
    const client = {
      ...baseClient,
      documentContext: 'Extra context here.',
    };
    const result = buildSystemPrompt(client);
    expect(result).toContain('---');
    expect(result.indexOf('---')).toBeGreaterThan(result.indexOf('Acme Corp sells widgets.'));
    expect(result.indexOf('Extra context here.')).toBeGreaterThan(result.indexOf('---'));
  });

  it('does not include a divider when documentContext is null', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).not.toContain('---');
  });
});
