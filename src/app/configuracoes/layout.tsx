import { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface ConfiguracoesLayoutProps {
  children: ReactNode;
}

export default function ConfiguracoesLayout({ children }: ConfiguracoesLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 