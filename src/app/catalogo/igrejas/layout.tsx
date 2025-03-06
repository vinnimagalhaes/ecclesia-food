import React from 'react';

export default function IgrejasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-app py-6">
      {children}
    </div>
  );
} 