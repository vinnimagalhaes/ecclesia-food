import React from 'react';
import { MapPin } from 'lucide-react';

interface AppIconLocationProps {
  location: string;
  className?: string;
  iconSize?: number;
}

export function AppIconLocation({
  location,
  className = '',
  iconSize = 14
}: AppIconLocationProps) {
  return (
    <div className={`flex items-center text-gray-500 text-sm ${className}`}>
      <MapPin size={iconSize} className="mr-1 flex-shrink-0" />
      <span>{location}</span>
    </div>
  );
} 