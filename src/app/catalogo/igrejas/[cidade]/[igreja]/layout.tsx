import React from 'react';

export default function EventosIgrejaLayout({
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