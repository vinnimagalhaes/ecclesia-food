import React, { ReactNode, CSSProperties } from 'react';
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
  sticky?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/',
  showHomeButton = false,
  children,
  gradient = true,
  sticky = false,
}: AppHeaderProps) {
  const backgroundClass = gradient 
    ? 'bg-gradient-to-r from-primary-600 to-primary-500' 
    : 'bg-primary-500';

  const positionStyle: CSSProperties = {
    position: 'relative',
    zIndex: 40,
  };
    
  const headerStyle: CSSProperties = {
    width: '100vw',
    marginLeft: 'calc(50% - 50vw)',
    marginRight: 'calc(50% - 50vw)',
    boxSizing: 'border-box',
    display: 'block',
    ...positionStyle
  };

  return (
    <div 
      id="app-header"
      className={`${backgroundClass} text-white shadow-md`}
      style={headerStyle}
    >
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center mb-2">
          {showBackButton && (
            <Link href={backUrl} className="mr-3 flex-shrink-0">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          )}
          <h1 className="text-2xl font-bold flex-1 overflow-ellipsis min-w-0" style={{ color: 'white' }}>{title}</h1>
          {showHomeButton && (
            <Link href="/" className="ml-3 flex-shrink-0">
              <Home className="h-5 w-5" />
            </Link>
          )}
        </div>
        
        {subtitle && (
          <p className="text-white/80 text-sm mb-4 truncate">{subtitle}</p>
        )}
        
        {children}
      </div>
    </div>
  );
} 