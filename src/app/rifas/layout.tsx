import { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface RifasLayoutProps {
  children: ReactNode;
}

export default function RifasLayout({ children }: RifasLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 