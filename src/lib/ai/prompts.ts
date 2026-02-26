import type { ClientConfig } from '@/types';

export function buildSystemPrompt(client: ClientConfig): string {
  let prompt = client.systemPrompt;

  if (client.documentContext) {
    prompt += '\n\n---\n\n' + client.documentContext;
  }

  return prompt;
}
