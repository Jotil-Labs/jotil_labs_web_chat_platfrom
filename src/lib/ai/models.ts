import type { ModelDefinition, Plan } from '@/types';

export const models: ModelDefinition[] = [
  {
    id: 'openai/gpt-5-nano',
    displayName: 'GPT-5 Nano',
    provider: 'openai',
    defaultForPlan: 'starter',
  },
  {
    id: 'openai/gpt-5',
    displayName: 'GPT-5',
    provider: 'openai',
    defaultForPlan: null,
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    displayName: 'Claude Haiku',
    provider: 'anthropic',
    defaultForPlan: null,
  },
  {
    id: 'anthropic/claude-sonnet-4-5',
    displayName: 'Claude Sonnet',
    provider: 'anthropic',
    defaultForPlan: null,
  },
  {
    id: 'google/gemini-2.0-flash',
    displayName: 'Gemini Flash',
    provider: 'google',
    defaultForPlan: null,
  },
];

export function getModelById(id: string): ModelDefinition | undefined {
  return models.find((m) => m.id === id);
}

export function getDefaultModelForPlan(plan: Plan): ModelDefinition {
  const model = models.find((m) => m.defaultForPlan === plan);
  return model ?? models[0];
}

export function isValidModel(id: string): boolean {
  return models.some((m) => m.id === id);
}
