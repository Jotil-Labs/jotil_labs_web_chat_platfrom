import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}

export function NavItem({ href, label, active, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
