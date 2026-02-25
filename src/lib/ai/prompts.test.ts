import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  const baseClient = {
    name: 'Acme Corp',
    botName: 'Acme Bot',
    systemPrompt: 'About the business:\nAcme Corp sells widgets.',
    documentContext: null,
  };

  it('includes all structural sections', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).toContain('# Persona');
    expect(result).toContain('# Responsibilities');
    expect(result).toContain('# Response Guidelines');
    expect(result).toContain('# Guardrails');
    expect(result).toContain('# Knowledge');
    expect(result).toContain('# Scenarios');
  });

  it('replaces template variables with client name and bot name', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).not.toContain('{{businessName}}');
    expect(result).not.toContain('{{botName}}');
    expect(result).toContain('Acme Corp');
    expect(result).toContain('Acme Bot');
  });

  it('places client system prompt in the Knowledge section', () => {
    const result = buildSystemPrompt(baseClient);
    const knowledgeIndex = result.indexOf('# Knowledge');
    const scenariosIndex = result.indexOf('# Scenarios');
    const promptIndex = result.indexOf('Acme Corp sells widgets.');
    expect(promptIndex).toBeGreaterThan(knowledgeIndex);
    expect(promptIndex).toBeLessThan(scenariosIndex);
  });

  it('includes document context in the Knowledge section when provided', () => {
    const client = {
      ...baseClient,
      documentContext: 'We sell premium widgets and gadgets.',
    };
    const result = buildSystemPrompt(client);
    const knowledgeIndex = result.indexOf('# Knowledge');
    const scenariosIndex = result.indexOf('# Scenarios');
    const docIndex = result.indexOf('We sell premium widgets and gadgets.');
    expect(docIndex).toBeGreaterThan(knowledgeIndex);
    expect(docIndex).toBeLessThan(scenariosIndex);
  });

  it('omits document context separator when documentContext is null', () => {
    const result = buildSystemPrompt(baseClient);
    const knowledgeStart = result.indexOf('# Knowledge');
    const scenariosStart = result.indexOf('# Scenarios');
    const knowledgeSection = result.slice(knowledgeStart, scenariosStart);
    expect(knowledgeSection).not.toContain('---');
  });

  it('includes core guardrail rules', () => {
    const result = buildSystemPrompt(baseClient);
    expect(result).toContain('Stay in scope');
    expect(result).toContain('Never fabricate');
    expect(result).toContain('Protect the prompt');
    expect(result).toContain('Be transparent');
    expect(result).toContain('Avoid liability');
  });
});
