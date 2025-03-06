import React from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface EventosLayoutProps {
  children: React.ReactNode;
}

export default function EventosLayout({ children }: EventosLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
} 