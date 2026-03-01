'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { createClient, updateClient } from '@/lib/db/admin-queries';
import type { ClientCreateInput, ClientUpdateInput } from '@/types';

export async function createClientAction(input: ClientCreateInput) {
  const supabase = await createSupabaseServer();
  const client = await createClient(supabase, input);
  redirect(`/dashboard/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  input: ClientUpdateInput
) {
  const supabase = await createSupabaseServer();
  await updateClient(supabase, clientId, input);
  redirect(`/dashboard/clients/${clientId}`);
}
