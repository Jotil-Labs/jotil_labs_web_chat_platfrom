-- Admin users table (linked to Supabase Auth)
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'client')),
  client_id uuid references clients(id) on delete set null,
  display_name text,
  created_at timestamptz not null default now()
);

create index idx_admin_users_email on admin_users(email);
create index idx_admin_users_role on admin_users(role);

-- Stripe-ready columns on clients (not wired up yet)
alter table clients add column if not exists billing_email text;
alter table clients add column if not exists stripe_customer_id text;
alter table clients add column if not exists stripe_subscription_id text;

-- Enable RLS on all tables
alter table clients enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table admin_users enable row level security;

-- RLS policies for clients
create policy "Admin full access to clients"
  on clients for all
  to authenticated
  using (
    exists (select 1 from admin_users where id = auth.uid() and role = 'admin')
  );

create policy "Client read own record"
  on clients for select
  to authenticated
  using (
    id = (select client_id from admin_users where id = auth.uid() and role = 'client')
  );

-- RLS policies for conversations
create policy "Admin full access to conversations"
  on conversations for all
  to authenticated
  using (
    exists (select 1 from admin_users where id = auth.uid() and role = 'admin')
  );

create policy "Client read own conversations"
  on conversations for select
  to authenticated
  using (
    client_id = (select client_id from admin_users where id = auth.uid() and role = 'client')
  );

-- RLS policies for messages
create policy "Admin full access to messages"
  on messages for all
  to authenticated
  using (
    exists (select 1 from admin_users where id = auth.uid() and role = 'admin')
  );

create policy "Client read own messages"
  on messages for select
  to authenticated
  using (
    conversation_id in (
      select c.id from conversations c
      join admin_users au on au.client_id = c.client_id
      where au.id = auth.uid() and au.role = 'client'
    )
  );

-- RLS policies for admin_users
create policy "Admin full access to admin_users"
  on admin_users for all
  to authenticated
  using (
    exists (select 1 from admin_users where id = auth.uid() and role = 'admin')
  );

create policy "User read own profile"
  on admin_users for select
  to authenticated
  using (id = auth.uid());
