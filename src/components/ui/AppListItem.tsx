import React, { ReactNode } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AppIconLocation } from './AppIconLocation';

interface AppListItemProps {
  href: string;
  title: string;
  subtitle?: string;
  location?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

export function AppListItem({
  href,
  title,
  subtitle,
  location,
  icon,
  rightIcon = <ArrowRight size={20} className="text-gray-400" />,
  className = '',
  onClick,
  showArrow = true,
}: AppListItemProps) {
  const content = (
    <>
      {icon && (
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        
        {subtitle && !location && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
        
        {location && (
          <AppIconLocation location={location} className="mt-1" />
        )}
        
        {subtitle && location && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {rightIcon}
    </>
  );

  const itemClassName = `flex items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 ${className}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={itemClassName}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={itemClassName}>
      {content}
    </Link>
  );
} 