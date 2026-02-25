import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  const baseClient = {
    name: 'Acme Corp',
    botName: 'Acme Bot',
    systemPrompt: 'You are the AI assistant for Acme Corp.',
    documentContext: null,
  };

  it('includes the base prompt rules', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).toContain('Rules you must always follow:');
    expect(result).toContain('Stay on topic');
    expect(result).toContain('Never make things up');
  });

  it('replaces [business name] with client name', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).not.toContain('[business name]');
    expect(result).toContain('Acme Corp');
  });

  it('appends client system prompt', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).toContain('You are the AI assistant for Acme Corp.');
  });

  it('includes document context when provided', () => {
    const client = {
      ...baseClient,
      documentContext: 'We sell widgets and gadgets.',
    };
    const result = buildSystemPrompt(client);
    expect(result).toContain('Reference Information:');
    expect(result).toContain('We sell widgets and gadgets.');
  });

  it('omits document context section when null', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).not.toContain('Reference Information:');
  });

  it('includes all 12 rules', () => {
    const result = buildSystemPrompt(baseClient);
    for (let i = 1; i <= 12; i++) {
      expect(result).toContain(`${i}.`);
    }
  });
});
