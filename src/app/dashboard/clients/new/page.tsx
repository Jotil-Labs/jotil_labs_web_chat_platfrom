import { PageHeader } from '@/components/dashboard/page-header';
import { ClientForm } from '@/components/dashboard/client-form';
import { createClientAction } from '../actions';
import { models } from '@/lib/ai/models';

export default function NewClientPage() {
  const modelOptions = models.map((m) => ({
    id: m.id,
    displayName: m.displayName,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add Client"
        description="Configure a new chatbot for a client."
      />
      <ClientForm models={modelOptions} onSubmit={createClientAction} />
    </div>
  );
}
