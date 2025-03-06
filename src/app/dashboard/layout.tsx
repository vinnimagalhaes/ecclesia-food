import { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 