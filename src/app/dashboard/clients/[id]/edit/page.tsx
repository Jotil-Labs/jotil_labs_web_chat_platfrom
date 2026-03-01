import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { getClientById } from '@/lib/db/admin-queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { ClientForm } from '@/components/dashboard/client-form';
import { updateClientAction } from '../../actions';
import { models } from '@/lib/ai/models';

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const client = await getClientById(supabase, id);

  if (!client) notFound();

  const modelOptions = models.map((m) => ({
    id: m.id,
    displayName: m.displayName,
  }));

  const handleUpdate = async (data: Parameters<typeof updateClientAction>[1]) => {
    'use server';
    await updateClientAction(id, data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${client.name}`}
        description="Update chatbot configuration."
      />
      <ClientForm client={client} models={modelOptions} onSubmit={handleUpdate} />
    </div>
  );
}
