import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar
        userEmail={user?.email}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name}
      />
      {/* Main content — add top padding on mobile for the fixed navbar */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 pt-20 md:pt-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">{children}</div>
      </main>
    </div>
  );
}
