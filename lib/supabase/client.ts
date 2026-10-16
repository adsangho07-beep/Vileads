import { createBrowserClient } from '@supabase/ssr';
import { DEMO_USER, DEMO_COOKIE_NAME } from '@/lib/demo';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  if (typeof document !== 'undefined') {
    const isDemo = document.cookie.includes(DEMO_COOKIE_NAME);
    if (isDemo) {
      const originalGetUser = client.auth.getUser.bind(client.auth);
      client.auth.getUser = async (jwt?: string) => {
        try {
          const res = await originalGetUser(jwt);
          if (res.data?.user) return res;
        } catch {
          // Ignore network errors in demo mode
        }
        return {
          data: { user: DEMO_USER as any },
          error: null,
        };
      };
    }
  }

  return client;
}
