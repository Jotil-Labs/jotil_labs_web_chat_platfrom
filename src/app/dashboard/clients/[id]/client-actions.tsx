'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/db/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientActionsProps {
  clientId: string;
  active: boolean;
}

export function ClientActions({ clientId, active }: ClientActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  const handleToggle = async () => {
    setLoading('toggle');
    const supabase = createSupabaseBrowser();
    await supabase
      .from('clients')
      .update({ active: !active, updated_at: new Date().toISOString() })
      .eq('id', clientId);
    router.refresh();
    setLoading('');
  };

  const handleReset = async () => {
    if (!confirm('Reset message usage to 0? This cannot be undone.')) return;
    setLoading('reset');
    const supabase = createSupabaseBrowser();
    await supabase
      .from('clients')
      .update({ messages_used: 0, updated_at: new Date().toISOString() })
      .eq('id', clientId);
    router.refresh();
    setLoading('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant={active ? 'destructive' : 'default'}
          size="sm"
          onClick={handleToggle}
          disabled={loading === 'toggle'}
        >
          {loading === 'toggle'
            ? 'Updating...'
            : active
              ? 'Deactivate Client'
              : 'Activate Client'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={loading === 'reset'}
        >
          {loading === 'reset' ? 'Resetting...' : 'Reset Usage'}
        </Button>
      </CardContent>
    </Card>
  );
}
