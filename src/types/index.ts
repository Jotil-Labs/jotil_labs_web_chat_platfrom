export type Plan = 'starter' | 'pro' | 'agency' | 'enterprise';
export type Position = 'bottom-right' | 'bottom-left';
export type MessageRole = 'user' | 'assistant';
export type Feedback = 'positive' | 'negative';

export interface ClientCustomization {
  bubbleIconUrl?: string;
  logoUrl?: string;
  greetingMessage?: string;
  glowEffect?: boolean;
}

export interface Client {
  id: string;
  name: string;
  domain: string;
  bot_name: string;
  welcome_message: string;
  system_prompt: string;
  ai_model: string;
  primary_color: string;
  border_radius: number;
  position: Position;
  document_context: string | null;
  customization: ClientCustomization;
  plan: Plan;
  message_limit: number;
  messages_used: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  visitor_id: string;
  started_at: string;
  last_message_at: string;
  metadata: Record<string, unknown> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  model_used: string | null;
  tokens_used: number | null;
  feedback: Feedback | null;
  created_at: string;
}

export interface WidgetConfig {
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  borderRadius: number;
  position: Position;
  bubbleIconUrl: string | null;
  logoUrl: string | null;
  greetingMessage: string | null;
  glowEffect: boolean;
}

export interface ChatRequest {
  clientId: string;
  conversationId: string | null;
  visitorId: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface FeedbackRequest {
  messageId: string;
  feedback: Feedback;
}

export interface ClientConfig {
  name: string;
  botName: string;
  systemPrompt: string;
  documentContext: string | null;
}

export interface ModelDefinition {
  id: string;
  displayName: string;
  provider: string;
  defaultForPlan: Plan | null;
}
