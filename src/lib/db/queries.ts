import { supabase } from './supabase';
import type { Client, Conversation, Message, Feedback } from '@/types';

export async function getActiveClient(
  clientId: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return data as Client;
}

export async function createConversation(
  clientId: string,
  visitorId: string,
  metadata?: Record<string, unknown>
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      client_id: clientId,
      visitor_id: visitorId,
      metadata: metadata ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }
  return data as Conversation;
}

export async function getLatestConversation(
  clientId: string,
  visitorId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', clientId)
    .eq('visitor_id', visitorId)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Conversation;
}

export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as Message[];
}

export async function saveMessage(params: {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      model_used: params.modelUsed ?? null,
      tokens_used: params.tokensUsed ?? null,
      prompt_tokens: params.promptTokens ?? null,
      completion_tokens: params.completionTokens ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save message: ${error?.message}`);
  }
  return data as Message;
}

export async function updateConversationTimestamp(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    throw new Error(
      `Failed to update conversation timestamp: ${error.message}`
    );
  }
}

export async function incrementUsage(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_messages_used', {
    client_id_param: clientId,
  });

  if (error) {
    // Fallback: read-then-write if RPC not available
    const { data } = await supabase
      .from('clients')
      .select('messages_used')
      .eq('id', clientId)
      .single();

    if (data) {
      await supabase
        .from('clients')
        .update({ messages_used: data.messages_used + 1 })
        .eq('id', clientId);
    }
  }
}

export async function setFeedback(
  messageId: string,
  feedback: Feedback
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ feedback })
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to set feedback: ${error.message}`);
  }
}
