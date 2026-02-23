import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function Layout({ children, fullWidth = false, className }: LayoutProps) {
  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full scroll-smooth">
        <Navbar />
        <main className={cn(
          "pb-32 md:pb-10",
          !fullWidth && "container mx-auto px-4 pt-6",
          className
        )}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
