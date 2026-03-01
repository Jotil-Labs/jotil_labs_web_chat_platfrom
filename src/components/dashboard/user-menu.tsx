'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/db/supabase-browser';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUser } from '@/types';

interface UserMenuProps {
  user: AdminUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {(user.display_name || user.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <p className="truncate text-sm font-medium">
            {user.display_name || user.email}
          </p>
          <Badge variant="secondary" className="mt-0.5 text-[10px] capitalize">
            {user.role}
          </Badge>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem className="text-sm text-muted-foreground" disabled>
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
