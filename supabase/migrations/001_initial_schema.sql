-- Jotil Chat: Initial Schema
-- Three tables: clients, conversations, messages

create extension if not exists "uuid-ossp";

create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null,
  bot_name text not null default 'Assistant',
  welcome_message text not null default 'Hi! How can I help you today?',
  system_prompt text not null default '',
  ai_model text not null default 'openai/gpt-5-nano',
  primary_color text not null default '#7C3AED',
  border_radius integer not null default 12,
  position text not null default 'bottom-right' check (position in ('bottom-right', 'bottom-left')),
  document_context text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency', 'enterprise')),
  message_limit integer not null default 2000,
  messages_used integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  metadata jsonb
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model_used text,
  tokens_used integer,
  feedback text check (feedback in ('positive', 'negative')),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_conversations_client_id on conversations(client_id);
create index idx_conversations_visitor_id on conversations(visitor_id);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_clients_domain on clients(domain);
