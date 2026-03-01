import Link from 'next/link';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { getDashboardStats } from '@/lib/db/admin-queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const stats = await getDashboardStats(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Monitor your chat platform at a glance."
        action={
          <Link href="/dashboard/clients/new">
            <Button>Add Client</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          description={`${stats.totalClients - stats.activeClients} inactive`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          title="Messages This Month"
          value={stats.messagesThisMonth.toLocaleString()}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Conversations"
          value={stats.totalConversations.toLocaleString()}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          }
        />
      </div>

      {stats.topClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clients by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topClients.map((client) => {
                const pct =
                  client.messageLimit > 0
                    ? Math.round(
                        (client.messagesUsed / client.messageLimit) * 100
                      )
                    : 0;
                return (
                  <div key={client.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                      <span className="text-muted-foreground">
                        {client.messagesUsed.toLocaleString()} /{' '}
                        {client.messageLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
