import { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface RelatoriosLayoutProps {
  children: ReactNode;
}

export default function RelatoriosLayout({ children }: RelatoriosLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 