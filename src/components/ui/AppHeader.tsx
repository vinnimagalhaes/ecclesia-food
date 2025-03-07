import React, { ReactNode } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  showHomeButton?: boolean;
  children?: ReactNode;
  gradient?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/',
  showHomeButton = false,
  children,
  gradient = true,
}: AppHeaderProps) {
  const backgroundClass = gradient 
    ? 'bg-gradient-to-r from-primary-600 to-primary-500' 
    : 'bg-primary-500';

  return (
    <div className={`${backgroundClass} text-white p-4 pt-6 pb-6 rounded-b-3xl shadow-md`}>
      <div className="flex items-center mb-2">
        {showBackButton && (
          <Link href={backUrl} className="mr-3">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        )}
        <h1 className="text-2xl font-bold flex-1">{title}</h1>
        {showHomeButton && (
          <Link href="/" className="ml-auto">
            <Home className="h-5 w-5" />
          </Link>
        )}
      </div>
      
      {subtitle && (
        <p className="text-white/80 text-sm mb-4">{subtitle}</p>
      )}
      
      {children}
    </div>
  );
} 