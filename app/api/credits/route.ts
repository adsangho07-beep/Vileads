import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.id === '00000000-0000-0000-0000-000000000001') {
      return NextResponse.json({
        balance: 50,
        transactions: [
          {
            id: 'tx-demo-1',
            user_id: user.id,
            type: 'signup_bonus',
            amount: 5,
            balance_after: 5,
            description: 'Bonus de bienvenue Vileads',
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          },
          {
            id: 'tx-demo-2',
            user_id: user.id,
            type: 'purchase',
            amount: 45,
            balance_after: 50,
            description: 'Pack Découverte (45 crédits)',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
        ],
      });
    }

    try {
      const [{ data: wallet }, { data: transactions, error: txError }] = await Promise.all([
        supabase.from('user_credits').select('balance, updated_at').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 500 });
      }

      return NextResponse.json({
        balance: wallet?.balance ?? 0,
        transactions: transactions || [],
      });
    } catch {
      // Fallback
      return NextResponse.json({
        balance: 50,
        transactions: [],
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
