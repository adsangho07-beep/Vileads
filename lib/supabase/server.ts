import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DEMO_USER, DEMO_COOKIE_NAME, DEMO_SEARCHES, DEMO_LEADS } from '@/lib/demo';

export function createClient() {
  const cookieStore = cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE_NAME);
  const isDemo = !!demoCookie?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handled for Server Components where cookies cannot be set directly
        }
      },
    },
  });

  if (isDemo) {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async (jwt?: string) => {
      try {
        const res = await originalGetUser(jwt);
        if (res.data?.user) return res;
      } catch {
        // Ignore fetch errors in demo mode
      }
      return {
        data: { user: DEMO_USER as any },
        error: null,
      };
    };
  }

  return client;
}
