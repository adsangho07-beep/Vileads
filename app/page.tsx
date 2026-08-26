import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();

  let isAuthenticated = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Supabase not configured yet — render landing
  }

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  redirect('/login');
}
