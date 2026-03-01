import Link from 'next/link';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { listClients } from '@/lib/db/admin-queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { ClientsTable } from './clients-table';
import type { Plan } from '@/types';

interface ClientsPageProps {
  searchParams: Promise<{
    q?: string;
    plan?: string;
    active?: string;
    page?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const search = params.q || '';
  const plan = (params.plan as Plan) || undefined;
  const active =
    params.active === 'true'
      ? true
      : params.active === 'false'
        ? false
        : undefined;
  const page = parseInt(params.page || '1', 10);
  const perPage = 10;

  const supabase = await createSupabaseServer();
  const { clients, total } = await listClients(supabase, {
    search: search || undefined,
    plan,
    active,
    page,
    perPage,
  });

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${total} client${total !== 1 ? 's' : ''} total`}
        action={
          <Link href="/dashboard/clients/new">
            <Button>Add Client</Button>
          </Link>
        }
      />

      <ClientsTable
        clients={clients}
        search={search}
        plan={plan}
        active={active}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
