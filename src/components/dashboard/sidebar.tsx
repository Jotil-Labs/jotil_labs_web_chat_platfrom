'use client';

import { usePathname } from 'next/navigation';
import { NavItem } from './nav-item';
import { UserMenu } from './user-menu';
import type { AdminUser } from '@/types';

interface SidebarProps {
  user: AdminUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight">Jotil Chat</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <NavItem
          href="/dashboard"
          label="Overview"
          active={pathname === '/dashboard'}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          }
        />
        <NavItem
          href="/dashboard/clients"
          label="Clients"
          active={pathname.startsWith('/dashboard/clients')}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
      </nav>

      <div className="border-t p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
