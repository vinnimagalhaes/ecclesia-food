import { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface VendasLayoutProps {
  children: ReactNode;
}

export default function VendasLayout({ children }: VendasLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 