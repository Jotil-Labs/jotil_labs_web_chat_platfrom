import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import {
  getClientById,
  listConversations,
  toggleClientActive,
  resetClientUsage,
} from '@/lib/db/admin-queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientActions } from './client-actions';

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab || 'overview';
  const conversationPage = parseInt(sp.page || '1', 10);

  const supabase = await createSupabaseServer();
  const client = await getClientById(supabase, id);
  if (!client) notFound();

  const { conversations, total: totalConversations } = await listConversations(
    supabase,
    { clientId: id, page: conversationPage, perPage: 10 }
  );
  const totalConvPages = Math.ceil(totalConversations / 10);

  const usagePct =
    client.message_limit > 0
      ? Math.round((client.messages_used / client.message_limit) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.domain}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={client.active ? 'default' : 'secondary'}>
              {client.active ? 'Active' : 'Inactive'}
            </Badge>
            <Link href={`/dashboard/clients/${id}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">
            Conversations ({totalConversations})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Messages Used"
              value={`${client.messages_used.toLocaleString()} / ${client.message_limit.toLocaleString()}`}
              description={`${usagePct}% of monthly limit`}
            />
            <StatCard title="Plan" value={client.plan.charAt(0).toUpperCase() + client.plan.slice(1)} />
            <StatCard title="AI Model" value={client.ai_model.split('/').pop() ?? client.ai_model} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Bot Name:</span>{' '}
                  {client.bot_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>{' '}
                  {client.position}
                </div>
                <div>
                  <span className="text-muted-foreground">Primary Color:</span>{' '}
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-3 w-3 rounded"
                      style={{ backgroundColor: client.primary_color }}
                    />
                    {client.primary_color}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Watermark:</span>{' '}
                  {client.show_watermark ? 'Shown' : 'Hidden'}
                </div>
                <div>
                  <span className="text-muted-foreground">Conversation Expiry:</span>{' '}
                  {client.conversation_expiry_hours ?? 24}h
                </div>
                <div>
                  <span className="text-muted-foreground">Starter Questions:</span>{' '}
                  {client.starter_questions?.length ?? 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embed Script</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block rounded bg-muted p-3 text-xs">
                {`<script src="https://chat.jotil.com/widget.js" data-client-id="${client.id}" async></script>`}
              </code>
            </CardContent>
          </Card>

          <ClientActions clientId={id} active={client.active} />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No conversations yet.
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell className="font-mono text-xs">
                          {conv.visitor_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{conv.message_count}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          <Link
                            href={`/dashboard/clients/${id}/conversations/${conv.id}`}
                            className="hover:underline"
                          >
                            {conv.last_message_preview || '(empty)'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalConvPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {conversationPage} of {totalConvPages}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/clients/${id}?tab=conversations&page=${conversationPage - 1}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={conversationPage <= 1}
                      >
                        Previous
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/clients/${id}?tab=conversations&page=${conversationPage + 1}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={conversationPage >= totalConvPages}
                      >
                        Next
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
