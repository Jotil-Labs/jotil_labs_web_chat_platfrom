import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminUser,
  Client,
  ClientCreateInput,
  ClientUpdateInput,
  ConversationWithStats,
  Message,
  Plan,
} from '@/types';

// All functions take the server Supabase client (anon key + RLS)
// so access control is handled by RLS policies automatically.

export async function getAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as AdminUser;
}

export async function getDashboardStats(supabase: SupabaseClient) {
  const [clientsRes, conversationsRes, messagesRes] = await Promise.all([
    supabase.from('clients').select('id, name, active, messages_used, message_limit'),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
  ]);

  const clients = (clientsRes.data ?? []) as {
    id: string;
    name: string;
    active: boolean;
    messages_used: number;
    message_limit: number;
  }[];

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.active).length;
  const totalConversations = conversationsRes.count ?? 0;
  const totalMessages = messagesRes.count ?? 0;

  // Sum of all clients' messages_used as "Messages This Month"
  const messagesThisMonth = clients.reduce(
    (sum, c) => sum + c.messages_used,
    0
  );

  // Top 5 clients by usage
  const topClients = [...clients]
    .sort((a, b) => b.messages_used - a.messages_used)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      messagesUsed: c.messages_used,
      messageLimit: c.message_limit,
    }));

  return {
    totalClients,
    activeClients,
    totalConversations,
    totalMessages,
    messagesThisMonth,
    topClients,
  };
}

export async function listClients(
  supabase: SupabaseClient,
  opts: {
    search?: string;
    plan?: Plan;
    active?: boolean;
    page: number;
    perPage: number;
  }
) {
  const { search, plan, active, page, perPage } = opts;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
  }
  if (plan) {
    query = query.eq('plan', plan);
  }
  if (active !== undefined) {
    query = query.eq('active', active);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to list clients: ${error.message}`);

  return {
    clients: (data ?? []) as Client[],
    total: count ?? 0,
  };
}

export async function getClientById(
  supabase: SupabaseClient,
  clientId: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error || !data) return null;
  return data as Client;
}

export async function createClient(
  supabase: SupabaseClient,
  input: ClientCreateInput
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: input.name,
      domain: input.domain,
      bot_name: input.bot_name,
      welcome_message: input.welcome_message,
      system_prompt: input.system_prompt,
      ai_model: input.ai_model,
      primary_color: input.primary_color,
      border_radius: input.border_radius ?? 12,
      position: input.position ?? 'bottom-right',
      document_context: input.document_context ?? null,
      customization: input.customization ?? {},
      starter_questions: input.starter_questions ?? null,
      show_watermark: input.show_watermark ?? true,
      conversation_expiry_hours: input.conversation_expiry_hours ?? 24,
      plan: input.plan,
      message_limit: input.message_limit,
      billing_email: input.billing_email ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create client: ${error?.message}`);
  }
  return data as Client;
}

export async function updateClient(
  supabase: SupabaseClient,
  clientId: string,
  input: ClientUpdateInput
): Promise<Client> {
  // Build update object — only include provided fields
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.domain !== undefined) update.domain = input.domain;
  if (input.bot_name !== undefined) update.bot_name = input.bot_name;
  if (input.welcome_message !== undefined)
    update.welcome_message = input.welcome_message;
  if (input.system_prompt !== undefined)
    update.system_prompt = input.system_prompt;
  if (input.ai_model !== undefined) update.ai_model = input.ai_model;
  if (input.primary_color !== undefined)
    update.primary_color = input.primary_color;
  if (input.border_radius !== undefined)
    update.border_radius = input.border_radius;
  if (input.position !== undefined) update.position = input.position;
  if (input.document_context !== undefined)
    update.document_context = input.document_context;
  if (input.customization !== undefined)
    update.customization = input.customization;
  if (input.starter_questions !== undefined)
    update.starter_questions = input.starter_questions;
  if (input.show_watermark !== undefined)
    update.show_watermark = input.show_watermark;
  if (input.conversation_expiry_hours !== undefined)
    update.conversation_expiry_hours = input.conversation_expiry_hours;
  if (input.plan !== undefined) update.plan = input.plan;
  if (input.message_limit !== undefined)
    update.message_limit = input.message_limit;
  if (input.active !== undefined) update.active = input.active;
  if (input.billing_email !== undefined)
    update.billing_email = input.billing_email;

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('clients')
    .update(update)
    .eq('id', clientId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update client: ${error?.message}`);
  }
  return data as Client;
}

export async function toggleClientActive(
  supabase: SupabaseClient,
  clientId: string,
  active: boolean
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', clientId);

  if (error) throw new Error(`Failed to toggle client: ${error.message}`);
}

export async function resetClientUsage(
  supabase: SupabaseClient,
  clientId: string
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ messages_used: 0, updated_at: new Date().toISOString() })
    .eq('id', clientId);

  if (error) throw new Error(`Failed to reset usage: ${error.message}`);
}

export async function listConversations(
  supabase: SupabaseClient,
  opts: {
    clientId: string;
    page: number;
    perPage: number;
  }
) {
  const { clientId, page, perPage } = opts;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Get conversations with message count
  const { data: conversations, count, error } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('client_id', clientId)
    .order('last_message_at', { ascending: false })
    .range(from, to);

  if (error)
    throw new Error(`Failed to list conversations: ${error.message}`);

  // For each conversation, get message count and last message preview
  const withStats: ConversationWithStats[] = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        message_count: msgCount ?? 0,
        last_message_preview: lastMsg?.content
          ? lastMsg.content.slice(0, 100)
          : null,
      } as ConversationWithStats;
    })
  );

  return {
    conversations: withStats,
    total: count ?? 0,
  };
}

export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get messages: ${error.message}`);
  return (data ?? []) as Message[];
}
