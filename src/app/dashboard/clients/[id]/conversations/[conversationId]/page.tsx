import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { getClientById, getConversationMessages } from '@/lib/db/admin-queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConversationPageProps {
  params: Promise<{ id: string; conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { id, conversationId } = await params;
  const supabase = await createSupabaseServer();

  const client = await getClientById(supabase, id);
  if (!client) notFound();

  const messages = await getConversationMessages(supabase, conversationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversation"
        description={`${client.name} — ${messages.length} messages`}
        action={
          <Link href={`/dashboard/clients/${id}?tab=conversations`}>
            <Button variant="outline" size="sm">
              Back to Conversations
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages in this conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2.5',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <div
                  className={cn(
                    'mt-1.5 flex flex-wrap items-center gap-2 text-[10px]',
                    msg.role === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  <span>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                  {msg.model_used && (
                    <span>{msg.model_used.split('/').pop()}</span>
                  )}
                  {msg.tokens_used != null && (
                    <span>{msg.tokens_used} tokens</span>
                  )}
                  {msg.feedback && (
                    <Badge
                      variant={
                        msg.feedback === 'positive' ? 'default' : 'destructive'
                      }
                      className="h-4 text-[9px]"
                    >
                      {msg.feedback === 'positive' ? 'Thumbs Up' : 'Thumbs Down'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
