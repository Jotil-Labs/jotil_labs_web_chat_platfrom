import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { ChatMessage } from '@/types';

export function resolveModel(modelId: string) {
  const [provider, ...rest] = modelId.split('/');
  const modelName = rest.join('/');

  switch (provider) {
    case 'openai':
      return openai(modelName);
    case 'anthropic':
      return anthropic(modelName);
    case 'google':
      return google(modelName);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export function streamChatResponse(
  modelId: string,
  systemPrompt: string,
  messages: ChatMessage[]
) {
  const model = resolveModel(modelId);

  return streamText({
    model,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    maxTokens: 1024,
    temperature: 0.7,
  });
}
