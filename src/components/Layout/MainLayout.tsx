// Location: src/components/Layout/MainLayout.tsx

import React, { ReactNode } from 'react';
import Header from '../Header';

interface LayoutProps {
  children: ReactNode;
  studentName?: string;
}

export default function MainLayout({ children, studentName }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header studentName={studentName} />
      <main>{children}</main>
    </div>
  );
}