import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/db/supabase-server';
import { Sidebar } from '@/components/dashboard/sidebar';
import type { AdminUser } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={adminUser as AdminUser} />
      <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
        {children}
      </main>
    </div>
  );
}
